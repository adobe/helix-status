## [1.4.4](https://github.com/adobe/helix-pingdom-status/compare/v1.4.3...v1.4.4) (2019-07-12)


### Bug Fixes

* **status:** add timeout for backend checks ([d90e6ff](https://github.com/adobe/helix-pingdom-status/commit/d90e6ff)), closes [#11](https://github.com/adobe/helix-pingdom-status/issues/11)

## [1.4.3](https://github.com/adobe/helix-pingdom-status/compare/v1.4.2...v1.4.3) (2019-07-11)


### Bug Fixes

* **status:** include x-version header ([#14](https://github.com/adobe/helix-pingdom-status/issues/14)) ([7d71fa2](https://github.com/adobe/helix-pingdom-status/commit/7d71fa2)), closes [#7](https://github.com/adobe/helix-pingdom-status/issues/7)

## [1.4.2](https://github.com/adobe/helix-pingdom-status/compare/v1.4.1...v1.4.2) (2019-07-11)


### Bug Fixes

* **status:** always send 200 ([9a5400a](https://github.com/adobe/helix-pingdom-status/commit/9a5400a)), closes [#12](https://github.com/adobe/helix-pingdom-status/issues/12)

## [1.4.1](https://github.com/adobe/helix-pingdom-status/compare/v1.4.0...v1.4.1) (2019-07-05)


### Bug Fixes

* **error:** add missing ] in CDATA section ([9ac26a5](https://github.com/adobe/helix-pingdom-status/commit/9ac26a5)), closes [#9](https://github.com/adobe/helix-pingdom-status/issues/9)
* **report:** use version from correct package.json ([0b467df](https://github.com/adobe/helix-pingdom-status/commit/0b467df)), closes [#7](https://github.com/adobe/helix-pingdom-status/issues/7)

# [1.4.0](https://github.com/adobe/helix-pingdom-status/compare/v1.3.2...v1.4.0) (2019-06-27)


### Features

* **index:** only report status when __ow_path is undefined or empty ([c13f273](https://github.com/adobe/helix-pingdom-status/commit/c13f273))

## [1.3.2](https://github.com/adobe/helix-pingdom-status/compare/v1.3.1...v1.3.2) (2019-06-26)


### Bug Fixes

* **wrap:** exclude parameters in ALL_CAPS from qualifying for pass-through ([c418dad](https://github.com/adobe/helix-pingdom-status/commit/c418dad))

## [1.3.1](https://github.com/adobe/helix-pingdom-status/compare/v1.3.0...v1.3.1) (2019-06-26)


### Bug Fixes

* **index:** do not report status for get requests with URL parameters when wrapping ([207cb3a](https://github.com/adobe/helix-pingdom-status/commit/207cb3a))

# [1.3.0](https://github.com/adobe/helix-pingdom-status/compare/v1.2.0...v1.3.0) (2019-06-16)


### Features

* **index:** include version in pingdom response ([84fee5b](https://github.com/adobe/helix-pingdom-status/commit/84fee5b)), closes [#1](https://github.com/adobe/helix-pingdom-status/issues/1)

# [1.2.0](https://github.com/adobe/helix-pingdom-status/compare/v1.1.0...v1.2.0) (2019-06-16)


### Features

* **index:** respond with a useful error message when one of the checks fails ([70fae6d](https://github.com/adobe/helix-pingdom-status/commit/70fae6d))

# [1.1.0](https://github.com/adobe/helix-pingdom-status/compare/v1.0.0...v1.1.0) (2019-06-16)


### Features

* **index:** allow passing a series of checks to the function ([4aadefe](https://github.com/adobe/helix-pingdom-status/commit/4aadefe))

# 1.0.0 (2019-06-16)


### Bug Fixes

* **index:** fix OW Method name and handling of empty parameters ([79f1c00](https://github.com/adobe/helix-pingdom-status/commit/79f1c00))


### Features

* **index:** support returning a pingdom status report on GET requests ([559d373](https://github.com/adobe/helix-pingdom-status/commit/559d373))

# [1.1.0](https://github.com/adobe/helix-service/compare/v1.0.1...v1.1.0) (2019-06-12)


### Features

* **action:** turn action into a web action ([f41f212](https://github.com/adobe/helix-service/commit/f41f212))

## [1.0.1](https://github.com/adobe/helix-service/compare/v1.0.0...v1.0.1) (2019-06-12)


### Bug Fixes

* **build:** add missing dependency ([aa163d7](https://github.com/adobe/helix-service/commit/aa163d7))

# 1.0.0 (2019-06-12)


### Bug Fixes

* **build:** add wsk property for release tracking ([9e36a10](https://github.com/adobe/helix-service/commit/9e36a10))
* **build:** increase version number to get a release ([f04ab95](https://github.com/adobe/helix-service/commit/f04ab95))
