declare module "cookie" {
  export function serialize(name: string, value: string, options?: Object): string;
  export function parse(str: string, options?: Object): Object;
}
