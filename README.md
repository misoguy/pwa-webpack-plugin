# pwa-webpack-plugin
A webpack plugin to make Progressive Web App(PWA) with ease.

Highly inspired by [`sw-precache-webpack-plugin`][sw-precache-webpack-plugin] and 
[`favicons-webpack-plugin`][favicons-webpack-plugin]

## Install
```bash
yarn add -D pwa-webpack-plugin
```
or
```bash
npm install --save-dev pwa-webpack-plugin
```

## How to use
Simply add the `pwa-webpack-plugin` in to your webpack config with a path to your favicon image
```javascript
// webpack.config.js
var path = require('path');
const PWAWebpackPlugin = require('pwa-webpack-plugin');

module.exports = {
  ...
  plugins: [
    new PWAWebpackPlugin({
      faviconImage: path.resolve(__dirname, 'path/to/your/image'),
    }),
  ],
}
```

This plugin will then
1. Make all necessary favicons with [`favicons`][favicons] into `path-to-your-output/icons`.
2. Make `path-to-your-output/service-worker.js` with [`sw-precache`][sw-precache] so that it includes output files from webpack to be cached.
3. Make `path-to-your-output/service-worker-register.js` which registers to `service-worker.js` made from step 2.

4. Assuming that you are using [`html-webpack-plugin`][html-webpack-plugin], inject all required tags produced into the `index.html` made from [`html-webpack-plugin`][html-webpack-plugin]
```html
<!-- index.html -->
<link rel=manifest href=/manifest.json>
...etc
<link rel="shortcut icon" href=/icons/favicon.ico>
...etc
<script type=text/javascript src=/service-worker-registration.js></script>

```

## Work In Progress
As this project was started out to help my other [opensource project](https://github.com/misoguy/ossfinder), I am still unaware of other use cases. Even if I try my best not to make breaking changes to the API, it can definitely change if needed.

## Contributions
Feedbacks, feature requests and contributions are always welcome.

## Options
Full documentation will be written when the API seems stable enough.  
This is the only option I'd recommend using for now.
```ts
{
    faviconImage: string
}
```

## License

This project is licensed under [MIT](https://github.com/jantimon/html-webpack-plugin/blob/master/LICENSE).


<!--references-->
[sw-precache-webpack-plugin]: https://github.com/goldhand/sw-precache-webpack-plugin
[favicons-webpack-plugin]: https://github.com/jantimon/favicons-webpack-plugin
[html-webpack-plugin]: https://github.com/jantimon/html-webpack-plugin
[sw-precache]: https://github.com/GoogleChromeLabs/sw-precache
[favicons]: https://github.com/evilebottnawi/favicons
