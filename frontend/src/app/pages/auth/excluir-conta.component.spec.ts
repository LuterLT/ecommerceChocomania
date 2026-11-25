import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { ExcluirContaComponent } from './excluir-conta.component';

describe('ExcluirContaComponent', () => {
  let fixture: ComponentFixture<ExcluirContaComponent>;
  let result: Subject<void>;
  const auth = { deleteAccount: vi.fn() };
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    vi.clearAllMocks();
    result = new Subject<void>();
    auth.deleteAccount.mockReturnValue(result);
    await TestBed.configureTestingModule({
      imports: [ExcluirContaComponent],
      providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router }],
    }).compileComponents();
    fixture = TestBed.createComponent(ExcluirContaComponent);
    fixture.detectChanges();
  });

  it('warns about permanent deletion and cancels without making a request', () => {
    expect(fixture.nativeElement.textContent).toContain('Esta ação não pode ser desfeita.');
    expect(auth.deleteAccount).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('.logout-link').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/logado');
    expect(auth.deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation, blocks duplicate actions, and redirects after success', () => {
    fixture.nativeElement.querySelector('.delete-account-confirm').click();
    fixture.detectChanges();
    expect(auth.deleteAccount).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.delete-account-confirm').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.logout-link').disabled).toBe(true);
    fixture.componentInstance.confirm();
    fixture.componentInstance.cancel();
    expect(auth.deleteAccount).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    result.next();
    result.complete();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('shows deletion errors and allows retrying or canceling', () => {
    fixture.componentInstance.confirm();
    result.error(new HttpErrorResponse({ status: 503, error: { mensagem: 'Serviço indisponível.' } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Serviço indisponível.');
    expect(fixture.componentInstance.deleting()).toBe(false);
    expect(fixture.nativeElement.querySelector('.delete-account-confirm').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.logout-link').disabled).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('lets deletion finish after navigation without redirecting from the destroyed screen', () => {
    fixture.componentInstance.confirm();
    fixture.destroy();
    expect(result.observed).toBe(true);
    result.next();
    result.complete();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
