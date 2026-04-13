import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _loadingCount = 0;
  isLoading = signal(false);

  show() {
    this._loadingCount++;
    this.isLoading.set(true);
  }

  hide() {
    this._loadingCount--;
    if (this._loadingCount <= 0) {
      this._loadingCount = 0;
      this.isLoading.set(false);
    }
  }
}
