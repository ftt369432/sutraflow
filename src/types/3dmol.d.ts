declare module '3dmol' {
  export function createViewer(element: HTMLElement | string, config: any): any;
  export function download(query: string, viewer: any, options: any, callback: () => void): void;
  export const rasmolElementColors: any;
}
