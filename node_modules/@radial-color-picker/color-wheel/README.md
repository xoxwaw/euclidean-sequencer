## Radial Color Picker - Color Wheel

<p>
    <a href="https://www.npmjs.com/package/@radial-color-picker/color-wheel">
        <img src="https://img.shields.io/npm/dt/@radial-color-picker/color-wheel.svg" alt="Downloads">
    </a>
    <a href="https://www.npmjs.com/package/@radial-color-picker/color-wheel">
        <img src="https://img.shields.io/npm/v/@radial-color-picker/color-wheel.svg" alt="Version">
    </a>
    <a href="https://www.npmjs.com/package/@radial-color-picker/color-wheel">
        <img src="https://img.shields.io/npm/l/@radial-color-picker/color-wheel.svg" alt="License">
    </a>
    <a href="https://circleci.com/gh/radial-color-picker/color-wheel">
        <img src="https://circleci.com/gh/radial-color-picker/color-wheel.svg?style=shield" alt="CircleCI">
    </a>
</p>

Minimal, framework-agnostic companion plugin for managing the color wheel of the Radial Color Picker.

## Install

Via yarn

```bash
$ yarn add @radial-color-picker/color-wheel
```

## Usage

```js
import fillColorWheel from '@radial-color-picker/color-wheel';

fillColorWheel(canvas, size);
```

## Change log

Please see [Releases][link-releases] for more information on what has changed recently.

## Contributing

If you're interested in the project you can help out with feature requests, bugfixes, documentation improvements or any other helpful contributions. You can use the issue list of this repo for bug reports and feature requests and as well as for questions and support.

Please see [CONTRIBUTING](CONTRIBUTING.md) and [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) for details.

## Credits

- [Rosen Kanev][link-author]
- [All Contributors][link-contributors]

This plugin is a heavily modified version of Lea Verou's polyfill [conic-gradient][link-conic-gradient]. While the polyfill aims to provide a fallback for the CSS level 4 `conic-gradient` and `repeating-conic-gradient` notations this plugin's sole purpose is for generating a hue wheel.

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[Back To Top](#user-content-radial-color-picker---color-wheel)

[link-conic-gradient]: https://github.com/leaverou/conic-gradient
[link-author]: https://github.com/rkunev
[link-contributors]: ../../contributors
[link-releases]: ../../releases
