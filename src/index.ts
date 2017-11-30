import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as swPrecache from 'sw-precache';
import * as favicons from 'favicons';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';

import workerRegistrationBuilder from './workerRegistrationBuilder';

interface IPluginOptions {
  shouldCreateFavicon: boolean;
  shouldCreateServiceWorker: boolean;
  faviconImage?: string;
  faviconConfig: favicons.IConfiguration;
  serviceWorkerConfig: swPrecache.SWConfig;
  injectHtmlTags: boolean;
}

class PWAWebpackPlugin {
  private pluginOptions: IPluginOptions = {
    shouldCreateFavicon: true,
    shouldCreateServiceWorker: true,
    faviconConfig: {
      appName: 'PWA App',
      appDescription: 'PWA App made with pwa-webpack-plugin',
      background: '#ffffff',
      theme_color: '#000000',
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false,
      },
    },
    serviceWorkerConfig: {},
    injectHtmlTags: true,
  };

  private userOptions: IPluginOptions;

  private outputPath: string;
  private outputPublicPath: string;

  private packageJson: any;

  private faviconResultHtml: string[];

  constructor(options: IPluginOptions) {
    this.userOptions = options;
  }

  public apply(compiler: any) {
    this.init(compiler);

    // 1. Make favicons files into output path
    if (this.pluginOptions.shouldCreateFavicon) {
      this.makeFavicon(compiler);
    }

    // 2. Make serviceWorkerRegistration file into output path
    if (this.pluginOptions.shouldCreateServiceWorker) {
      const filename = 'service-worker-registration.js';
      this.makeServiceWorkerRegistration(compiler, filename);
    }

    // 3. Hook into html-webpack-plugin to inject html tags created above
    if (this.pluginOptions.injectHtmlTags) {
      compiler.plugin('compilation', (compilation: any) => {
        if (this.pluginOptions.shouldCreateFavicon) {
          this.injectFaviconGeneratedHtml(compilation);
        }
        if (this.pluginOptions.shouldCreateServiceWorker) {
          const filename = 'service-worker-registration.js';
          this.injectServiceWorkerRegistration(compilation, filename);
        }
      });
    }

    // 4. Make service worker file into output path
    if (this.pluginOptions.shouldCreateServiceWorker) {
      const filename = 'service-worker.js';
      this.makeServiceWorker(compiler, filename);
    }
  }

  private init(compiler: any) {
    const { context, options } = compiler;
    const { output } = options;

    this.outputPath = output.path;
    this.outputPublicPath = output.publicPath || '/';

    let packageJson = path.resolve(context, 'package.json');
    if (fs.existsSync(packageJson)) {
      this.packageJson = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    } else {
      packageJson = path.resolve(context, '../package.json');
      if (fs.existsSync(packageJson)) {
        this.packageJson = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      }
    }

    if (this.packageJson.name) {
      this.pluginOptions.faviconConfig.appName = this.packageJson.name;
    }
    if (this.packageJson.description) {
      this.pluginOptions.faviconConfig.appDescription = this.packageJson.description;
    }

    this.pluginOptions.serviceWorkerConfig = {
      staticFileGlobs: [
        `${this.outputPath}/**/*.{js,html,css,json,ico,png,jpg,jpeg}`,
      ],
      stripPrefix: `${this.outputPath}/`,
      navigateFallback: this.outputPublicPath + 'index.html',
    };

    this.pluginOptions = { ...this.pluginOptions, ...this.userOptions };
  }

  private makeFavicon(compiler: any, iconAssetsPath: string = '/icons') {
    compiler.plugin('make', (compilation: any, callback: any) => {
      if (this.pluginOptions.faviconImage) {
        const faviconOutputPath = `${this.outputPath}${iconAssetsPath}`;
        this.pluginOptions.faviconConfig.path = iconAssetsPath;
        favicons(
          this.pluginOptions.faviconImage,
          this.pluginOptions.faviconConfig,
          (err, result) => {
            if (err) {
              console.error(err);
            }
            const { images, files, html } = result;
            this.faviconResultHtml = html.map(h => {
              if (h.indexOf('manifest.json') !== -1) {
                return h.replace(iconAssetsPath, '');
              }
              // Change apple status bar style emitted from favicons
              // <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent'>
              // to
              // <meta name='apple-mobile-web-app-status-bar-style' content='default'>
              if (h.indexOf('black-translucent') !== -1) {
                return h.replace('black-translucent', 'default');
              }
              return h;
            });

            const promises: Array<Promise<any>> = [];

            images.forEach(image => {
              promises.push(
                this.writeFile(
                  faviconOutputPath,
                  image.name,
                  image.contents,
                  compiler
                )
              );
            });

            files.forEach(file => {
              if (file.name.indexOf('manifest.json') !== -1) {
                promises.push(
                  this.writeFile(
                    this.outputPath,
                    file.name,
                    file.contents,
                    compiler
                  )
                );
              } else {
                promises.push(
                  this.writeFile(
                    faviconOutputPath,
                    file.name,
                    file.contents,
                    compiler
                  )
                );
              }
            });

            Promise.all(promises).then(() => callback(null));
          }
        );
      } else {
        callback(
          new Error('Path to image file is required in options.faviconImage')
        );
      }
    });
  }

  private makeServiceWorkerRegistration(
    compiler: any,
    filename: string,
    overrideContents?: string
  ) {
    const serviceWorkerRegistrationResult =
      overrideContents || workerRegistrationBuilder(this.outputPublicPath);
    compiler.plugin('make', (compilation: any, callback: any) => {
      this.writeFile(
        this.outputPath,
        filename,
        serviceWorkerRegistrationResult,
        compiler
      );
      callback(null);
    });
  }

  private injectFaviconGeneratedHtml(compilation: any) {
    compilation.plugin(
      'html-webpack-plugin-before-html-processing',
      (htmlPluginData: any, callback: any) => {
        // Add favicon meta infos before closing head tag
        if (htmlPluginData.plugin.options.favicons !== false) {
          htmlPluginData.html = htmlPluginData.html.replace(
            /(<\/head>)/i,
            this.faviconResultHtml.join('') + '$&'
          );
        }
        callback(null, htmlPluginData);
      }
    );
  }

  private injectServiceWorkerRegistration(compilation: any, filename: string) {
    compilation.plugin(
      'html-webpack-plugin-after-html-processing',
      (htmlPluginData: any, callback: any) => {
        // Add service-worker-registration scripts before closing body tag
        htmlPluginData.html = htmlPluginData.html.replace(
          /(<\/body>)/i,
          `<script type=text/javascript src=${this.outputPublicPath}${
            filename
          }></script>\n` + '$&'
        );
        callback(null, htmlPluginData);
      }
    );
  }

  private makeServiceWorker(compiler: any, filename: string) {
    compiler.plugin('after-emit', (compilation: any, callback: any) => {
      swPrecache.generate(
        this.pluginOptions.serviceWorkerConfig,
        (err, contents) => {
          if (err) {
            callback(err);
          }
          if (contents) {
            this.writeFile(this.outputPath, filename, contents, compiler);
          }
        }
      );
      callback(null);
    });
  }

  private writeFile(
    outputPath: string,
    filename: string,
    content: string | Buffer,
    compiler: any
  ): Promise<void> {
    const { outputFileSystem } = compiler;
    const filepath = path.resolve(outputPath, filename);

    return new Promise((resolve, reject) => {
      outputFileSystem.mkdirp(path.resolve(filepath, '..'), (mkdirErr: any) => {
        if (mkdirErr) {
          reject(mkdirErr);
          return;
        }
        outputFileSystem.writeFile(filepath, content, (writeError: any) => {
          if (writeError) {
            reject(writeError);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

module.exports = PWAWebpackPlugin;
