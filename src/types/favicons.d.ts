declare module 'favicons' {
  export = Favicons;

  function Favicons(
    source: string,
    configuration: Favicons.IConfiguration,
    callback: (error: Favicons.IError, response: Favicons.IResponse) => void
  ): void;

  namespace Favicons {
    export interface IConfiguration {
      appName?: string; // Your application's name. `string`
      appDescription?: string; // Your application's description. `string`
      developerName?: string; // Your (or your developer's) name. `string`
      developerURL?: string; // Your (or your developer's) URL. `string`
      background?: string; // Background colour for flattened icons. `string`
      theme_color?: string; // Theme color for browser chrome. `string`
      path?: string; // Path for overriding default icons path. `string`
      display?: 'browser' | 'standalone'; // Android display: "browser" or "standalone". `string`
      orientation?: 'portrait' | 'landscape'; // Android orientation: "portrait" or "landscape". `string`
      start_url?: string; // Android start application's URL. `string`
      version?: string; // Your application's version number. `number`
      logging?: boolean; // Print logs to console? `boolean`
      online?: boolean; // Use RealFaviconGenerator to create favicons? `boolean`
      preferOnline?: boolean; // Use offline generation, if online generation has failed. `boolean`
      icons?: {
        // Platform Options:
        // - offset - offset in percentage
        // - shadow - drop shadow for Android icons, available online only
        // - background:
        //   * false - use default
        //   * true - force use default, e.g. set background for Android icons
        //   * color - set background for the specified icons
        //
        android?: boolean; // Create Android homescreen icon. `boolean` or `{ offset, background, shadow }`
        appleIcon?: boolean; // Create Apple touch icons. `boolean` or `{ offset, background }`
        appleStartup?: boolean; // Create Apple startup images. `boolean` or `{ offset, background }`
        coast?: boolean | { offset?: number; background: string }; // Create Opera Coast icon with offset 25%. `boolean` or `{ offset, background }`
        favicons?: boolean; // Create regular favicons. `boolean`
        firefox?: boolean; // Create Firefox OS icons. `boolean` or `{ offset, background }`
        windows?: boolean; // Create Windows 8 tile icons. `boolean` or `{ background }`
        yandex?: boolean; // Create Yandex browser icon. `boolean` or `{ background }`
      };
    }

    export interface IError {
      status?: string; // HTTP error code (e.g. `200`) or `null`
      name: string; // Error name e.g. "API Error"
      message: string; // Error description e.g. "An unknown error has occurred"
    }

    export interface IResponse {
      images: { name: string; contents: Buffer }[]; // Array of { name: string, contents: <buffer> }
      files: { name: string; contents: string }[]; // Array of { name: string, contents: <string> }
      html: string[]; // Array of strings (html elements)
    }
  }
}
