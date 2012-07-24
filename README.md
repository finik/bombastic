
# Overview
In Android build system a manifest XML file decides which components go into the build (also sometimes referred to as _Bill Of Materials_ or _BOM_, hence the name of the project *bom-bastic*), which revisions should be used for each component, and it should be pulled from (remote git servers). When maintaining/developing multiple products from one code base it is therefore convenient to use multiple manifests (one per product) to keep every product build stable and prevent regressions on product A build (which can be in code freeze), while product B is in active development and modifies top of the tree.

The bombastic system is graphical, web-based front end that allows easy editing the manifest while employing testing and automation to prevent changes that destabilize or introduce regressions to the product build. In a typical scenario, direct editing of the manifest would be disabled/discouraged within the organization and developers/maintainers would be advised to use bombastic to edit the manifest, the flow would go like this:

* A change being integrated into one of the components X (it passed peer review, some pre-commit testing etc). It is commited, however it does not affect a product build yet,
as a product build does not pull automatically from the top of the tree.

* Integrator logs into bombastic and submits a request for a change (group of changes) for product manifest to pick up a new version of the component X.

* Bombastic triggers a jenkins build with a request ID as a parameter.

* Jenkins build uses the ID to contact bombastic and pull the most recent manifest with the above changes applied, build it and run a set of regression tests.

* Upon sucessfull completion of the build/regression tests bombastic updates the status if the request and actually submits the change to the manifest git, thus making the change part of the official build. 


Features:

* LDAP authentication
	Currently, the only authentication scheme supported.

* Jenkins integration
	Supports single jenkins server, one jenkins job per product. If you need to build several components (AFS, kernel, bootloaders, firmware) and run automated testson it, you should hook bombastic to a single master job that will trigger sub-jobs and wait for their completion.

* Persistent storage
	MongoDB is used for storing all the pending and processed change requests. It ensures pending changes are never lost. 

* Multiple product profiles:
	One bombastic instance can support multiple products, each product should have its own working folder for locally manipulating the manifest. Different products can share a jenkins job even though that is not recommended as it may cause problems on the jenkins side.

# Install
	git clone https://github.com/finik/bombastic.git
	cd bombastic
	npm install

## Mongo configuration
Bombastic uses mongodb for all its stroage needs, please refer to official mongodb documenation for setting it up in your environment. At this point there are no special
requirements for mongo installation, and no specific version you should be using, we are using a pretty standard and basic features.

## Jenkins job configuration
The only parameter that bombastic is passing to the jenkins job when it triggers it is *BOMBASTIC_ID* and it contains a uniqueue identifier of the manifest change. Jenkins job is expected to use that identifier to pull a complete manifest from bombastic using bombastic REST API. Make sure your job is set to be "parametrized" and it has a BOMBASTIC_ID string parameter. See the sample jenkins build script below for details:
```
curl "http://bombastic.example.com/api/get/${BOMBASTIC_ID}" > .repo/manifests/manifest_${BOMBASTIC_ID}.xml
repo sync -m manifest_${BOMBASTIC_ID}.xml
lunch product-userdebug
make
```

## Configure

By default, bombastic will load JSON configuration from the config.json file. This configuration can be overriden and the config file name can be provided on the command line, this is the only command line parameter bombastic accepts:
	node server.js /path/to//my_config.json

# Usage
TBD

# Contribute
Several technologies are used in this project: node.js, jQuery, MongoDb, Twitter Bootstrap. I don't claim to be an expert in any of them, moreover, this is the first time I do anything in JavaScript. Therefore, any patches and contributions are more than welcome, even if it doesn't add any features or fixes bugs, even if it is only a cleanup or a
conceptually cleaner way of doing some things, please send pull requests and describe the motivation, if it makes sense it will be integrated.

# License
MIT. See "LICENSE" file.