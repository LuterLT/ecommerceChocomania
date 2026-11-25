#Requires -Version 7.0
<#
.SYNOPSIS
Executa verificações HTTP contra uma API Chocomania já iniciada.
.DESCRIPTION
Cria duas contas com e-mails smoke+UUID e mantém os registros no banco para
permitir inspeção. Não remove contas nem altera o estoque do catálogo.
#>
param(
    [string] $BaseUrl = 'http://localhost:8080',
    [string] $HealthBaseUrl = $BaseUrl
)

$ErrorActionPreference = 'Stop'
Import-Module Microsoft.PowerShell.Utility
$BaseUrl = $BaseUrl.TrimEnd('/')
$HealthBaseUrl = $HealthBaseUrl.TrimEnd('/')
$script:Checks = 0

function Assert-That {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw "Falha: $Message" }
    $script:Checks++
}

function New-Client {
    return @{
        Session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
        Token = $null
    }
}

function Send-Request {
    param(
        [hashtable] $Client,
        [string] $Method,
        [string] $Path,
        [int] $ExpectedStatus = 200,
        [object] $Body,
        [hashtable] $Headers = @{},
        [switch] $WithoutCsrf,
        [switch] $RawBody
    )
    $requestHeaders = @{}
    foreach ($entry in $Headers.GetEnumerator()) { $requestHeaders[$entry.Key] = $entry.Value }
    if ($Method -ne 'GET' -and -not $WithoutCsrf -and $Client.Token) {
        $requestHeaders['X-CSRF-TOKEN'] = $Client.Token
    }
    # Invoke-WebRequest mantém cabeçalhos personalizados na WebSession entre chamadas.
    # Cada intenção deve enviar apenas seus próprios cabeçalhos, preservando os cookies.
    $Client.Session.Headers.Clear()
    $request = @{
        Uri = if ($Path.StartsWith('http://') -or $Path.StartsWith('https://')) { $Path } else { "$BaseUrl$Path" }
        Method = $Method
        WebSession = $Client.Session
        Headers = $requestHeaders
        SkipHttpErrorCheck = $true
        TimeoutSec = 30
    }
    if ($PSBoundParameters.ContainsKey('Body')) {
        $request.ContentType = 'application/json; charset=utf-8'
        $request.Body = if ($RawBody) { [string] $Body } else { $Body | ConvertTo-Json -Depth 12 -Compress }
    }
    $response = Invoke-WebRequest @request
    $content = if ($response.Content -is [byte[]]) {
        [System.Text.Encoding]::UTF8.GetString($response.Content)
    } else {
        [string] $response.Content
    }
    Assert-That ([int] $response.StatusCode -eq $ExpectedStatus) (
        "$Method $Path retornou $($response.StatusCode); esperado $ExpectedStatus. Corpo: $content"
    )
    $json = if ($content) { $content | ConvertFrom-Json } else { $null }
    return [pscustomobject] @{
        Json = $json
        ETag = [string] ($response.Headers['ETag'] | Select-Object -First 1)
        Content = $content
    }
}

function Update-Csrf {
    param([hashtable] $Client)
    $response = Send-Request $Client GET '/api/v1/csrf'
    Assert-That ($response.Json.headerName -eq 'X-CSRF-TOKEN') 'Cabeçalho CSRF inesperado.'
    Assert-That (-not [string]::IsNullOrWhiteSpace($response.Json.token)) 'Token CSRF ausente.'
    $Client.Token = $response.Json.token
}

$client = New-Client
$health = Send-Request $client GET "$HealthBaseUrl/actuator/health"
Assert-That ($health.Json.status -eq 'UP') 'API ou banco indisponível.'
Update-Csrf $client

$categories = Send-Request $client GET '/api/v1/categorias'
Assert-That (@($categories.Json.itens).Count -eq 4) 'Catálogo deve conter quatro categorias.'
$products = Send-Request $client GET '/api/v1/produtos?tamanho=100'
Assert-That ($products.Json.total -eq 40 -and @($products.Json.itens).Count -eq 40) 'Seed deve conter 40 produtos.'
$filtered = Send-Request $client GET '/api/v1/produtos?categoriaId=1&busca=%20CHOCOLATE%20&pagina=2&tamanho=3'
Assert-That ($filtered.Json.total -eq 10 -and @($filtered.Json.itens).Count -eq 3) 'Filtro ou paginação incorretos.'
Assert-That (($filtered.Json.itens.id -join ',') -eq '4,5,6') 'Ordenação da segunda página incorreta.'
$detail = Send-Request $client GET '/api/v1/produtos/2'
Assert-That ($detail.Json.precoFinalCentavos -eq 1607 -and $detail.Json.categoria.id -eq 1) 'Preço ou categoria incorretos.'
$null = Send-Request $client GET '/api/v1/produtos/999999' 404
$null = Send-Request $client GET '/api/v1/produtos?pagina=0' 400
$null = Send-Request $client GET '/api/v1/produtos?categoriaId=999999'

$untrusted = New-Client
$forbidden = Send-Request $untrusted POST '/api/v1/usuarios' 403 -Body @{} -WithoutCsrf
Assert-That ($forbidden.Json.codigo -eq 'CSRF_INVALIDO') 'Mutações devem exigir CSRF.'
$null = Send-Request $untrusted PUT '/api/v1/usuarios/me' 403 -Body @{
    nomeCompleto = 'Sem sessão'; email = 'anonimo@example.com'
} -WithoutCsrf
$null = Send-Request $client PUT '/api/v1/usuarios/me' 401 -Body @{
    nomeCompleto = 'Sem sessão'; email = 'anonimo@example.com'
}
$null = Send-Request $client POST '/api/v1/usuarios' 400 -Body '{' -RawBody
$null = Send-Request $client POST '/api/v1/usuarios' 422 -Body @{
    nomeCompleto = ''; email = 'invalido'; senha = 'curta'
}

$empty = Send-Request $client GET '/api/v1/carrinho'
Assert-That (@($empty.Json.itens).Count -eq 0) 'Visitante novo deve ter carrinho vazio.'
Assert-That (-not [string]::IsNullOrWhiteSpace($empty.ETag)) 'Carrinho deve retornar ETag.'
$key = [guid]::NewGuid().ToString()
$added = Send-Request $client POST '/api/v1/carrinho/itens' 201 -Body @{
    produtoId = 2; quantidade = 2
} -Headers @{ 'Idempotency-Key' = $key }
Assert-That ($added.Json.totalCentavos -eq 3214) 'Total deve usar desconto arredondado por unidade.'
$repeated = Send-Request $client POST '/api/v1/carrinho/itens' 200 -Body @{
    produtoId = 2; quantidade = 2
} -Headers @{ 'Idempotency-Key' = $key }
Assert-That ($repeated.Json.versao -eq $added.Json.versao -and $repeated.Json.itens[0].quantidade -eq 2) (
    'Repetir uma intenção não deve acrescentar itens nem incrementar versão.'
)
$null = Send-Request $client POST '/api/v1/carrinho/itens' 409 -Body @{
    produtoId = 2; quantidade = 1
} -Headers @{ 'Idempotency-Key' = $key }
$null = Send-Request $client PATCH '/api/v1/carrinho/itens/2' 428 -Body @{ quantidade = 3 }
$null = Send-Request $client PATCH '/api/v1/carrinho/itens/2' 412 -Body @{
    quantidade = 3
} -Headers @{ 'If-Match' = $empty.ETag }
$updated = Send-Request $client PATCH '/api/v1/carrinho/itens/2' 200 -Body @{
    quantidade = 3
} -Headers @{ 'If-Match' = $added.ETag }
Assert-That ($updated.Json.totalCentavos -eq 4821) 'Alteração deve recalcular o total.'
$stockError = Send-Request $client POST '/api/v1/carrinho/itens' 409 -Body @{
    produtoId = 2; quantidade = 999999
}
Assert-That ($stockError.Json.codigo -eq 'ESTOQUE_INSUFICIENTE') "Estoque excedido deve retornar conflito: $($stockError.Content)"
$same = Send-Request $client DELETE '/api/v1/carrinho/itens/999999' 200 -Headers @{ 'If-Match' = $updated.ETag }
Assert-That ($same.ETag -eq $updated.ETag) 'Remoção de item ausente não deve mudar versão.'

$runId = [guid]::NewGuid().ToString('N')
$email = "smoke+$runId@example.com"
$otherEmail = "smoke+$runId-second@example.com"
$password = 'Smoke-test-123!'
$registered = Send-Request $client POST '/api/v1/usuarios' 201 -Body @{
    nomeCompleto = 'Conta de teste HTTP'; email = $email; senha = $password; dataNascimento = '2000-01-01'
}
Assert-That ($registered.Json.usuario.email -eq $email) 'Cadastro deve iniciar a sessão da conta.'
Assert-That ($registered.Content -notmatch '(?i)senha|password|hash') 'Resposta de conta não deve expor credenciais.'
$account = Send-Request $client GET '/api/v1/sessao'
Assert-That ($account.Json.usuario.id -eq $registered.Json.usuario.id) 'Sessão deve identificar o usuário cadastrado.'
$owned = Send-Request $client GET '/api/v1/carrinho'
Assert-That ($owned.Json.id -eq $updated.Json.id -and $owned.Json.itens[0].quantidade -eq 3) (
    'Cadastro deve transferir o carrinho visitante para a conta.'
)
$null = Send-Request $client POST '/api/v1/usuarios' 409 -Body @{
    nomeCompleto = 'Conta repetida'; email = $email.ToUpperInvariant(); senha = $password
}
$newEmail = "smoke+$runId-updated@example.com"
$null = Send-Request $client PUT '/api/v1/usuarios/me' 403 -Body @{
    nomeCompleto = 'Nome rejeitado'; email = $newEmail
} -WithoutCsrf
$null = Send-Request $client PUT '/api/v1/usuarios/me' 422 -Body @{
    nomeCompleto = ''; email = 'invalido'
}
$null = Send-Request $client PUT '/api/v1/usuarios/me' 400 -Body @{
    nomeCompleto = 'Tentativa de outra identidade'; email = $newEmail; id = 999999
}
$null = Send-Request $client PUT '/api/v1/usuarios/me' 400 -Body @{
    nomeCompleto = 'Tentativa de outra senha'; email = $newEmail; senha = 'Senha-nao-permitida'
}
$rejectedProfile = Send-Request $client GET '/api/v1/sessao'
Assert-That ($rejectedProfile.Json.usuario.nomeCompleto -eq 'Conta de teste HTTP' -and $rejectedProfile.Json.usuario.email -eq $email) (
    'Campos desconhecidos não devem alterar o perfil nem permitir alteração de identidade ou senha.'
)
$null = Send-Request $client OPTIONS '/api/v1/usuarios/me' 200 -Headers @{
    Origin = 'http://localhost:5173'; 'Access-Control-Request-Method' = 'PUT'; 'Access-Control-Request-Headers' = 'content-type,x-csrf-token'
} -WithoutCsrf
$profile = Send-Request $client PUT '/api/v1/usuarios/me' 200 -Body @{
    nomeCompleto = '  Perfil atualizado HTTP  '; email = $newEmail.ToUpperInvariant()
}
Assert-That ($profile.Json.usuario.id -eq $registered.Json.usuario.id) 'Atualização deve preservar a identidade da conta.'
Assert-That ($profile.Json.usuario.nomeCompleto -eq 'Perfil atualizado HTTP' -and $profile.Json.usuario.email -eq $newEmail) (
    'Atualização deve normalizar nome e e-mail.'
)
Assert-That ($profile.Content -notmatch '(?i)senha|password|hash') 'Atualização não deve expor credenciais.'
$persistedProfile = Send-Request $client GET '/api/v1/sessao'
Assert-That ($persistedProfile.Json.usuario.nomeCompleto -eq 'Perfil atualizado HTTP' -and $persistedProfile.Json.usuario.email -eq $newEmail) (
    'Consulta posterior deve retornar os dados persistidos.'
)
$oldEmail = $email
$email = $newEmail
$null = Send-Request $client DELETE '/api/v1/sessao' 204
Update-Csrf $client
$null = Send-Request $client GET '/api/v1/sessao' 401
$afterLogout = Send-Request $client GET '/api/v1/carrinho'
Assert-That (@($afterLogout.Json.itens).Count -eq 0 -and $afterLogout.Json.id -ne $owned.Json.id) (
    'Logout deve iniciar um contexto visitante vazio e separado da conta.'
)
$null = Send-Request $client POST '/api/v1/sessao' 401 -Body @{ email = $email; senha = 'Senha-incorreta' }
$null = Send-Request $client POST '/api/v1/sessao' 401 -Body @{ email = $oldEmail; senha = $password }
$null = Send-Request $client POST '/api/v1/sessao' 200 -Body @{ email = $email; senha = $password }
$restored = Send-Request $client GET '/api/v1/carrinho'
Assert-That ($restored.Json.id -eq $owned.Json.id -and $restored.Json.itens[0].quantidade -eq 3) (
    'Login deve restaurar o carrinho persistido da conta.'
)
$null = Send-Request $client DELETE '/api/v1/sessao' 204
Update-Csrf $client
$null = Send-Request $client POST '/api/v1/usuarios' 201 -Body @{
    nomeCompleto = 'Segunda conta de teste HTTP'; email = $otherEmail; senha = $password
}
$conflict = Send-Request $client PUT '/api/v1/usuarios/me' 409 -Body @{
    nomeCompleto = 'Tentativa com e-mail ocupado'; email = $email.ToUpperInvariant()
}
Assert-That ($conflict.Json.codigo -eq 'EMAIL_JA_CADASTRADO') 'E-mail ocupado deve retornar conflito de domínio.'
$unchangedProfile = Send-Request $client GET '/api/v1/sessao'
Assert-That ($unchangedProfile.Json.usuario.email -eq $otherEmail -and $unchangedProfile.Json.usuario.nomeCompleto -eq 'Segunda conta de teste HTTP') (
    'Conflito não deve alterar parcialmente o perfil.'
)
$otherCart = Send-Request $client GET '/api/v1/carrinho'
Assert-That (@($otherCart.Json.itens).Count -eq 0 -and $otherCart.Json.id -ne $owned.Json.id) (
    'Outra conta não deve acessar o carrinho anterior.'
)
$null = Send-Request $client DELETE '/api/v1/sessao' 204

Write-Output "OK: $script:Checks verificações HTTP concluídas."
Write-Output "Contas de teste mantidas no banco: $email e $otherEmail"
Write-Output "Carrinho da primeira conta: $($owned.Json.id); produto 2, quantidade 3, total 4821 centavos."
