# modus-project

modus-assignment

# How to Run

after cloning the repository, install all npm modules

```bash
npm install
```

Then run via `npm run start` it will listen on port 8080

or 

```bash
node app.js
```

## configuration via environment variables

you can change the host of the NHTSA via an environemnt variable `NGTSA_HOST`  
If not set it defaults to `one.nhtsa.gov`

Example 

```bash
export NGTSA_HOST=one.nhtsa.gov && node app.js
```

you can change the listen port of the server with the environment variable `LISTEN_PORT`.
It will default to `8080` if `LISTEN_PORT` is not set or is an invalid integer.

```bash
export LISTEN_PORT=8081 && node app.js
```

### Test

There is some testing in place but not extensive

```
npm run test
```
