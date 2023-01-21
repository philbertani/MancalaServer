const Sequelize = require('sequelize')
const pkg = require('../../package.json')

const databaseName = pkg.name + (process.env.NODE_ENV === 'test' ? '-test' : '')

const config = {
  logging: false
};

if(process.env.LOGGING === 'true'){
  delete config.logging
}

//https://stackoverflow.com/questions/61254851/heroku-postgres-sequelize-no-pg-hba-conf-entry-for-host
if(process.env.DATABASE_URL){
  config.dialectOptions = {
    ssl: {
      rejectUnauthorized: false
    }
  };
}

const db = new Sequelize(
  process.env.DATABASE_URL || `postgres://localhost:5432/${databaseName}`, config)

  //postgres://play:vUnTBCRyYR7kW5FMVc8nW1gts0cqeTzx@dpg-cf5lalla499d72s5g9bg-a/mancala
  //postgres://play:vUnTBCRyYR7kW5FMVc8nW1gts0cqeTzx@dpg-cf5lalla499d72s5g9bg-a.ohio-postgres.render.com/mancala

module.exports = db
