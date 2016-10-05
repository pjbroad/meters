# Record and graph your utility meters usage.

## Introduction

Meters is a web application that uses Mongo DB to record, retrieve and
graph, utility meter readings. Mongo access is provided through a
python-flask API. I use gas and electricity readings but other
utilities can be set when configuring the application. While raw
readings are recorded, the plotted graph shows the difference between
the previous readings, calculated as units-consumed-per-day.

## Setting up meters

You can either configure the API to use a local flask server or
configure to use WSGI with your web server. Only the Apache web server
has been tested.  The following packages are required, for example on a
Debian based system. Up to date packages from mongodb.com are
recommended for the database over those that come with most Linux
distributions.

```
sudo apt-get install apache2 python-pymongo mongodb python-flask libapache2-mod-wsgi
```

#### Examples

This document contains snippets of code to help install and configure 
meters.  To use most of these snippets directly, set the following 
shell variables to refer to your code locations.

```
export CODEBASE=$HOME/code/meters
export DEPSBASE=$HOME/code/meters_dependencies
```

#### Configure the Database API

To set-up the API, a configuration file is needed for the database. 
This configuration file can be generated then edited. Be sure to 
specify the database name, this is unset by default; a good name could 
be "meters".  Include the quotes.  For example:

```
cd $CODEBASE
# remove or move any existing config file
[ -r config/mongodb_config.json ] && mv config/mongodb_config.json config/mongodb_config.json.old
api/common.py > new_config
mv new_config config/mongodb_config.json
vi config/mongodb_config.json
# check the configuration is correct
api/common.py
```

#### Configure the web server

Create a WSGI configuration file appropriate for your code path.  This
can be generated from a provided template. Also enable wsgi. For
example:

```
cd $CODEBASE/api
cp ../config/template_meters_api.wsgi meters_api.wsgi
sed -i "s|###path-to-api###|$CODEBASE/api|g" meters_api.wsgi
vi meters_api.wsgi
sudo a2enmod wsgi
```

Assuming an Apache web server, generate a config file from the apache
template config/template_meters_apache.conf then modify this point at
your html and api directories.  Copy the modified file to
/etc/apache2/conf-available/ and enable the configuration. For example:

```
cd $CODEBASE/config
cp template_meters_apache.conf meters_apache.conf
sed -i "s|###path-to-html###|$CODEBASE/html|g" meters_apache.conf
sed -i "s|###path-to-api###|$CODEBASE/api|g" meters_apache.conf
vi meters_apache.conf
sudo cp meters_apache.conf /etc/apache2/conf-available/
rm meters_apache.conf
sudo a2enconf meters_apache
```

Finally, restart your Apache web service.

```
sudo service apache2 reload
```

#### Configure web application options

Modify server/config/template_meters_config.js to refer to your API 
directory then copy to html/meters_config.js. Also set the type of 
utility meters you wish to use.  For example:

```
cd $CODEBASE/config
cp template_meters_config.js meters_config.js
vi meters_config.js
mv meters_config.js ../html
```

#### Get JavaScript libraries

Download the JavaScript libraries for c3, d3, jquery and jquery-ui, 
unpack them and add the required files to the html/lib directory. For 
example:

```
mkdir -p $DEPSBASE/js_libraries && cd $DEPSBASE/js_libraries
wget -qO- https://github.com/c3js/c3/archive/0.4.11.tar.gz | tar xzv
wget -q https://github.com/d3/d3/releases/download/v3.5.17/d3.zip && unzip -d d3-v3.5.17 d3.zip && rm d3.zip
mkdir -p jquery-3.1.0 && cd jquery-3.1.0 && wget -qO jquery.min.js https://code.jquery.com/jquery-3.1.0.min.js && cd ..
wget https://jqueryui.com/resources/download/jquery-ui-1.12.0.zip && unzip jquery-ui-1.12.0.zip && rm jquery-ui-1.12.0.zip

cd $CODEBASE/html && mkdir -p lib && cd lib
cp $DEPSBASE/js_libraries/c3-0.4.11/c3.min.css .
cp $DEPSBASE/js_libraries/c3-0.4.11/c3.min.js .
cp $DEPSBASE/js_libraries/d3-v3.5.17/d3.min.js .
cp $DEPSBASE/js_libraries/jquery-3.1.0/jquery.min.js .
cp $DEPSBASE/js_libraries/jquery-ui-1.12.0/jquery-ui.min.css .
cp $DEPSBASE/js_libraries/jquery-ui-1.12.0/jquery-ui.min.js .
cp -R $DEPSBASE/js_libraries/jquery-ui-1.12.0/images .
```

#### Testing the database set-up

These commands will write a record to the database and read it back 
using curl (you may need to install curl. Be sure to specify your own 
server certificate if needed (--cacert <file>) and URL. For example:

```
curl -X POST -d @- http://localhost/meters_api/add << EOT
{"date":$(date +"%Y%m%d"), "epoch":$(date +"%s"), "reading":{"electricity":42, "gas":999}}
EOT
curl http://localhost/meters_api/last
```

The output should be similar to that below. If the status is false then check 
your set-up.

```
{
    "status":true,
    "data":{
        "date":20161004,
        "epoch":1475617086,
        "reading":{
            "electricity":42,
            "gas":999
        }
    }
}
```

#### Create Database Indexes

Without too much performance tuning, creating some basic indexes for
the database does provide a speed improvement.  Be sure to use the name
of the database you have actually configured.  For example using the
mongo shell:

```
mongo

use meters
db.readings.dropIndexes()
db.readings.createIndex({"date":1, "epoch":1})
db.readings.createIndex({"date":-1, "epoch":-1})
```

#### Testing the web server

You should now be able to point your web browser at for example /meters 
on your Apache web server. To add, view and graph readings. 
