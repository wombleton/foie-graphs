foie-graphs
===========

Scan an alaveteli instance and generate FOI performance graphs for the last 
twelve months.

HOWTO
=====

1. Fork this project to your own github repository. 
1. Make any changes required for language and so forth to `templates/index.jade`.
1. Create a gh-pages branch in the repository.
1. Run it locally. fyi.org.nz uses the following details: `USER=wombleton REPO=foie-graphs TOKEN=secret_oauth_token ALAVETELI=https://fyi.org.nz npm start`
1. Deploy to heroku as per https://devcenter.heroku.com/articles/nodejs to keep graphs up to date automatically.

EXAMPLE
=======

You can see an example of the graphs running against [fyi.org.nz](https://fyi.org.nz) here: <http://wombleton.github.io/foie-graphs>
