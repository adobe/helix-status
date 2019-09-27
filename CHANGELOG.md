## [4.3.5](https://github.com/adobe/helix-status/compare/v4.3.4...v4.3.5) (2019-09-27)


### Bug Fixes

* update package.json to fix vulns ([e54827c](https://github.com/adobe/helix-status/commit/e54827c))
* Upgrade all to fix vulns ([e25c252](https://github.com/adobe/helix-status/commit/e25c252))
* Would crash in the action because of outdated helix log ([47e7cf9](https://github.com/adobe/helix-status/commit/47e7cf9))

## [4.3.4](https://github.com/adobe/helix-status/compare/v4.3.3...v4.3.4) (2019-09-27)


### Bug Fixes

* **monitoring:** remove deprecated locations, reduce overall number ([a2b619f](https://github.com/adobe/helix-status/commit/a2b619f)), closes [#50](https://github.com/adobe/helix-status/issues/50)

## [4.3.3](https://github.com/adobe/helix-status/compare/v4.3.2...v4.3.3) (2019-09-04)


### Bug Fixes

* **bin:** guard against having more than 20 monitors ([71189fb](https://github.com/adobe/helix-status/commit/71189fb))

## [4.3.2](https://github.com/adobe/helix-status/compare/v4.3.1...v4.3.2) (2019-09-04)


### Bug Fixes

* **bin:** do not print complete error message on failure ([33db323](https://github.com/adobe/helix-status/commit/33db323))

## [4.3.1](https://github.com/adobe/helix-status/compare/v4.3.0...v4.3.1) (2019-09-03)


### Bug Fixes

* **user-agent:** fix user agent version strings ([994a6c6](https://github.com/adobe/helix-status/commit/994a6c6))

# [4.3.0](https://github.com/adobe/helix-status/compare/v4.2.1...v4.3.0) (2019-09-03)


### Bug Fixes

* **check:** use standard format for user agent string ([f4ebfb4](https://github.com/adobe/helix-status/commit/f4ebfb4)), closes [/github.com/adobe/helix-status/pull/43#discussion_r320057819](https://github.com//github.com/adobe/helix-status/pull/43/issues/discussion_r320057819)


### Features

* **http:** include a user agent for all requests ([75049cf](https://github.com/adobe/helix-status/commit/75049cf))
* **index:** add support for probot applications ([9002686](https://github.com/adobe/helix-status/commit/9002686))

## [4.2.1](https://github.com/adobe/helix-status/compare/v4.2.0...v4.2.1) (2019-09-02)


### Bug Fixes

* **dependencies:** npm audit fix ([64540f2](https://github.com/adobe/helix-status/commit/64540f2))

# [4.2.0](https://github.com/adobe/helix-status/compare/v4.1.0...v4.2.0) (2019-08-19)


### Bug Fixes

* **status:** report timeouts with 504, all other backend errors with 502 ([a9b99c3](https://github.com/adobe/helix-status/commit/a9b99c3)), closes [#38](https://github.com/adobe/helix-status/issues/38)


### Features

* **status:** separate backend status from reported status ([5f6058e](https://github.com/adobe/helix-status/commit/5f6058e))

# [4.1.0](https://github.com/adobe/helix-status/compare/v4.0.0...v4.1.0) (2019-08-15)


### Bug Fixes

* **synthetics:** fix the environment variable name ([b903386](https://github.com/adobe/helix-status/commit/b903386))


### Features

* **newrelics:** provide installer script that creates a new monitor ([df9145a](https://github.com/adobe/helix-status/commit/df9145a)), closes [#36](https://github.com/adobe/helix-status/issues/36)

# [4.0.0](https://github.com/adobe/helix-status/compare/v3.1.1...v4.0.0) (2019-08-15)


### Styles

* **package:** rename to helix-status ([5f741a2](https://github.com/adobe/helix-status/commit/5f741a2)), closes [#29](https://github.com/adobe/helix-status/issues/29)


### BREAKING CHANGES

* **package:** Adjusts the package name to `helix-status`, as the library and service is no longer exclusive to Pingdom. The service will be available under a new name and the old package will be marked as deprecated on NPM with instructions to update to the new status library.

## [3.1.1](https://github.com/adobe/helix-pingdom-status/compare/v3.1.0...v3.1.1) (2019-08-14)


### Bug Fixes

* **action:** check for JSON path in pure runtime function, too ([2865c38](https://github.com/adobe/helix-pingdom-status/commit/2865c38)), closes [#34](https://github.com/adobe/helix-pingdom-status/issues/34)

# [3.1.0](https://github.com/adobe/helix-pingdom-status/compare/v3.0.0...v3.1.0) (2019-08-07)


### Bug Fixes

* **xml:** don't use CDATA, but escape XML strings ([fe432b4](https://github.com/adobe/helix-pingdom-status/commit/fe432b4))


### Features

* **status:** support getting status in JSON format ([9818461](https://github.com/adobe/helix-pingdom-status/commit/9818461))

# [3.0.0](https://github.com/adobe/helix-pingdom-status/compare/v2.0.2...v3.0.0) (2019-07-26)


### Features

* **index:** Return error status code on error (standard Http check) ([1468c04](https://github.com/adobe/helix-pingdom-status/commit/1468c04)), closes [#21](https://github.com/adobe/helix-pingdom-status/issues/21)


### BREAKING CHANGES

* **index:** Returns error Http status on error (Standard Http check) instead of always 200
(Custom Http check)

## [2.0.2](https://github.com/adobe/helix-pingdom-status/compare/v2.0.1...v2.0.2) (2019-07-25)


### Bug Fixes

* **package:** downgrade snyk to 1.199.0 ([622814c](https://github.com/adobe/helix-pingdom-status/commit/622814c)), closes [#26](https://github.com/adobe/helix-pingdom-status/issues/26)

## [2.0.1](https://github.com/adobe/helix-pingdom-status/compare/v2.0.0...v2.0.1) (2019-07-24)


### Bug Fixes

* **package:** update snyk to version 2.0.0 ([afe472b](https://github.com/adobe/helix-pingdom-status/commit/afe472b))

# [2.0.0](https://github.com/adobe/helix-pingdom-status/compare/v1.4.4...v2.0.0) (2019-07-23)


### Features

* **index:** base Pingdom check detection on user agent ([67d6aaa](https://github.com/adobe/helix-pingdom-status/commit/67d6aaa)), closes [#17](https://github.com/adobe/helix-pingdom-status/issues/17)
* **index:** determine if it's a pingdom check based on dedicated path rather than user agent ([f7e35c3](https://github.com/adobe/helix-pingdom-status/commit/f7e35c3)), closes [#17](https://github.com/adobe/helix-pingdom-status/issues/17)


### BREAKING CHANGES

* **index:** The behaviour of the wrapper changed. Pingdom status response generation depends on
a dedicated path instead of Http method and absence of parameters
* **index:** The behaviour of the wrapper changed. Pingdom status response generation depends on
user agent instead of Http method and absence of parameters.

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
