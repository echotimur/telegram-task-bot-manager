const mysql = require("mysql2");

const cron = require('node-cron');

const token = // your token;

// подключение к бд

// функция сна (основополагающая)
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function main(){
  var connection = mysql.createConnection({
    host: /*host*/,
    port: /*port*/,
    user: /*user*/,
    database: /*database*/,
    password: /*password*/
  });

  // тестирование подключения
  connection.connect(function(err){
    if (err) {
      return console.error("Ошибка: " + err.message);
    }
    else{
      console.log("Подключение к MySQL успешно установлено");
    }
  });
  connection.query("SELECT dead_line, id, point, status FROM task", (err, results) => {
    if(err) console.log(err);
    else{

      for(let i = 0; i < results.length; i++){
        let today = new Date();
        let dateSrc = today.toLocaleString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
        let dead;
        if(results[i].dead_line == null){
          dead = null;
        } else dead = results[i].dead_line.toLocaleDateString();
        if(dateSrc == dead){

          let prov = results[i].status;
          if(prov != '4' || prov != '2'){
            connection.query("UPDATE task SET status = 3 WHERE id = ?", results[i].id, (err) => {
              if(err) console.log(err);
              else{
                connection.query("SELECT chat_id FROM user WHERE access_modifier = 1", (error, result) => {
                  if(error) console.log(error);
                  else{
                    if(result.length == 0) return 0;
                    fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${result[0].chat_id}&text=Задание+номер+${results[i].id}+не+было+выполнено+в+срок.`);
                  }
                });
              }
            });
          }
          var massive = [results[i].id, results[i].point]
          connection.query("INSERT INTO task_bad(`num_bad`, `point`) VALUES(?, ?)", massive, (err) => {
            if(err) console.log(err);
          });
        }
      }
    }
  });
  setTimeout( () => {
    connection.end();
  }, 1000);
  return 0;
}

cron.schedule('30 16 * * *', () => {
  main();

});
