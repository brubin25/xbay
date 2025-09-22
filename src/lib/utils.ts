// lib/utils.ts
export function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
  }
  
  export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 180) {
    let t: any;
    return (...args: Parameters<T>) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }  