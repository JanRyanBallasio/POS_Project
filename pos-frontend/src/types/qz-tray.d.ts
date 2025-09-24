declare module 'qz-tray' {
  export const qz: {
    websocket: {
      connect(): Promise<void>;
    };
    printers: {
      find(name: string): Promise<string>;
    };
    configs: {
      create(printer: string, options: any): any;
    };
    print(config: any, data: string[]): Promise<void>;
  };
}
