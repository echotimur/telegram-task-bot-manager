const {Telegraf, Markup, Input} = require('telegraf');
const token = // your token;

const bot = new Telegraf(token);

const fs = require('fs');
const path = require('node:path');

const xlsx = require('xlsx');

const moment = require('moment');

const mysql = require("mysql2");

const cron = require('node-cron');

let num_task = 0;//для админа, при проверке задания

let pagination_num; //для пагинации всех заданий
let pagination_page; //-----
let pagination_page1; //----

let pagination_num_bad; //для пагинации невыполненых заданий
var pagination_page_bad; //++++++
var pagination_page1_bad; //+++++

// подключение к бд
var connection = mysql.createConnection({
  host: /*host*/,
  port: /*port*/,
  user: /*user*/,
  database: /*database*/,
  password: /*password*/
});

// тестирование подключения
cron.schedule('50 * * * *', () => {
  connection.connect(function(err){
    if (err) {
      return console.error("Ошибка: " + err.message);
      connection = mysql.createConnection({
        host: /*host*/,
        port: /*port*/,
        user: /*user*/,
        database: /*database*/,
        password: /*password*/
      });
    }
    else{
      console.log("Подключение к MySQL успешно установлено");
    }
  });
});

// возобновление подключения каждый час, чтоб через время не умирал
cron.schedule('50 * * * *', () => {
  connection.query("SELECT id FROM task WHERE status = 0", (err) => {
    if(err) console.log(err);
  });
});

// функция сна (удалить в конце разработки)
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

// пагинация сортировки по невыполненным
function listPrintRed(res){

  console.log('bad task watch');

  if(res.length < 5){
    let str_mass = [];
    for(let i = 0; i < res.length; i++){

      let mass_o = [];
      let str = '';

      for(let j = 0; j < 1; j++){

        mass_o[j] = 'Номер задания: ' + res[i].id;
        mass_o[j+1] = 'Задание: ' + res[i].point;
        mass_o[j+2] = 'Статус: 🔴 (время на выполнение истекло)' + '\n----------------------\n';
        str = mass_o.join('\n');
      }
      str_mass[i] = str;
    }
    return str_mass;
  }

  let str_mass = [];

  let first = res.length - 5 * pagination_num_bad;
  let second = res.length - 5 * (pagination_num_bad - 1);

  if(first <= 0){
    first = 0;
    second = 5;
  }
  if(second > res.length){
    second = res.length;
  }

  for(let i = first; i < second; i++){
    let mass = [];
    let str = '';
    for(let j = 0; j < 1; j++){
      mass[j] = 'Номер задания: ' + res[i].id;
      mass[j+1] = 'Задание: ' + res[i].point;
      mass[j+2] = 'Статус: 🔴 (время на выполнение истекло)' + '\n----------------------\n';
      str = mass.join('\n');
    }
    str_mass[i] = str;
  }
  return str_mass;
}

// пагинация списка всех заданий
function listPrintAll(res){

  console.log('task watch');

  if(res.length < 5){
    let str_mass = [];
    for(let i = 0; i < res.length; i++){

      let mass_o = [];
      let str = '';

      for(let j = 0; j < 1; j++){

        mass_o[j] = 'Номер задания: ' + res[i].id;
        mass_o[j+1] = 'Дата создания: ' + res[i].create_date.toLocaleDateString();
        mass_o[j+2] = 'Задание: ' + res[i].point;
        mass_o[j+3] = 'Ответственный: ' + res[i].responsible;
        if(res[i].dead_line == null) mass_o[j+4] = 'Срок сдачи: -';
        else mass_o[j+4] = 'Срок сдачи: ' + res[i].dead_line.toLocaleDateString();

        switch (res[i].status) {
          case 0:
          mass_o[j+5] = 'Статус: 🔵 (не добавлено)';
          break;

          case 1:
          mass_o[j+5] = 'Статус: 🟡 (в процессе выполнения)';
          break;

          case 2:
          mass_o[j+5] = 'Статус: 🟢 (выполнено)';
          break;

          case 3:
          mass_o[j+5] = 'Статус: 🔴 (время на выполнение истекло)';
          break;

          case 4:
          mass_o[j+5] = 'Статус: ⚪ (ждёт проверки)';
          break;

        }
        if(res[i].complete_date != null){
          mass_o[j+6] = 'Выполнено: ' + res[i].complete_date.toLocaleDateString() + '\n----------------------\n';
        } else mass_o[j+6] = '\n----------------------\n';
        str = mass_o.join('\n');
      }
      str_mass[i] = str;
    }
    return str_mass;
  }

  let str_mass = [];

  let first = res.length - 5 * pagination_num;
  let second = res.length - 5 * (pagination_num - 1);

  if(first <= 0){
    first = 0;
    second = 5;
  }
  if(second > res.length){
    second = res.length;
    first = res.length - 5;
  }

  for(let i = first; i < second; i++){

    let mass = [];
    let str = '';

    for(let j = 0; j < 1; j++){

      mass[j] = 'Номер задания: ' + res[i].id;
      mass[j+1] = 'Дата создания: ' + res[i].create_date.toLocaleDateString();
      mass[j+2] = 'Задание: ' + res[i].point;
      mass[j+3] = 'Ответственный: ' + res[i].responsible;
      if(res[i].dead_line == null) mass[j+4] = 'Срок сдачи: -';
      else mass[j+4] = 'Срок сдачи: ' + res[i].dead_line.toLocaleDateString();

      switch (res[i].status) {
        case 0:
        mass[j+5] = 'Статус: 🔵 (не добавлено)';
        break;

        case 1:
        mass[j+5] = 'Статус: 🟡 (в процессе выполнения)';
        break;

        case 2:
        mass[j+5] = 'Статус: 🟢 (выполнено)';
        break;

        case 3:
        mass[j+5] = 'Статус: 🔴 (время на выполнение истекло)';
        break;

        case 4:
        mass[j+5] = 'Статус: ⚪ (ждёт проверки)';
        break;

      }
      if(res[i].complete_date != null){
        mass[j+6] = 'Выполнено: ' + res[i].complete_date.toLocaleDateString() + '\n----------------------\n';
      } else mass[j+6] = '\n----------------------\n';
      str = mass.join('\n');
    }
    str_mass[i] = str;
  }
  return str_mass;
}

// обработка админского и диспетчерского сообщений
function message_process(){

  bot.on('message', (ctx) => {

    connection.query("SELECT access_modifier FROM user WHERE chat_id = ?", ctx.message.chat.id, (err, results) => {
      if(err) console.log(err);
      else{

        if(results[0].access_modifier == 1){

          let mass = ctx.update.message.text.split(' ');

          // console.log(typeof Number(mass[0]));
          // console.log(mass[50]);

          if(mass[0] == 'Стоп'){
            return 0;
          }




          if(typeof mass[1] != 'string'){
            num_task = Number(mass[0]);
            connection.query("SELECT status FROM task WHERE id = ?", num_task, (err, result) => {
              if(err) console.log(err);
              else{
                if(result[0].status == 4){

                  ctx.replyWithHTML('Результат задания соответствует заявленному?', Markup.inlineKeyboard([
                    [Markup.button.callback('👍', 'task_good'), Markup.button.callback('👎', 'task_bad')],
                    [Markup.button.callback('Назад', 'back')]
                  ]));
                  console.log('Check task from admin');

                } else if(result[0].status == 3){
                  connection.query("UPDATE task SET responsible = 'NULL', dead_line = NULL, status = 0, complete_date = NULL WHERE id = ?", num_task, (err) => {
                    if(err) console.log(err);
                    console.log('Bad task back to start from admin');
                  });

                  connection.query("SELECT chat_id FROM user WHERE access_modifier = 2", (err, resul) => {
                    if(err) console.log(err);
                    else{
                      if(resul.length == 0){
                        return 0;
                      }
                      let id = Number(resul[0].chat_id);
                      fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${id}&text=Задание+${num_task}+ждёт+добавления.+Проверьте+список+заданий.`, (error) => {
                        if(error) console.error('error:', error);
                      });
                    }
                  });
                  ctx.replyWithHTML('Задание переведено в статус повторного добавления');
                }
              }
            });
            return 0;

          } else if(new Date(mass[0].replace(/(\d+).(\d+).(\d+)/, '$1/$2/$3')) != 'Invalid Date'){
            console.log('Period of date from admin');
            var first = new Date(mass[0].replace(/(\d+).(\d+).(\d+)/, '$1/$2/$3'));
            var second = new Date(mass[1].replace(/(\d+).(\d+).(\d+)/, '$1/$2/$3'));
            var mass_a = [first, second];
            connection.query("SELECT * FROM task WHERE (create_date BETWEEN ? AND ?)", mass_a, (err, res) => {
              if(err){
                console.log(err);
                return 0;
              } else{
                if(res.length == 0){
                  ctx.replyWithHTML('Заданий в выбранный промежуток нет');
                  return 0;
                }
                let str_mass = [];
                for(let i = 0; i < res.length; i++){

                  let mass_o = [];
                  let str = '';

                  for(let j = 0; j < 1; j++){

                    mass_o[j] = 'Номер задания: ' + res[i].id;
                    mass_o[j+1] = 'Дата создания: ' + res[i].create_date.toLocaleDateString();
                    mass_o[j+2] = 'Задание: ' + res[i].point;
                    mass_o[j+3] = 'Ответственный: ' + res[i].responsible;
                    if(res[i].dead_line == null) mass_o[j+4] = 'Срок сдачи: -';
                    else mass_o[j+4] = 'Срок сдачи: ' + res[i].dead_line.toLocaleDateString();

                    switch (res[i].status) {
                      case 0:
                      mass_o[j+5] = 'Статус: 🔵 (не добавлено)';
                      break;

                      case 1:
                      mass_o[j+5] = 'Статус: 🟡 (в процессе выполнения)';
                      break;

                      case 2:
                      mass_o[j+5] = 'Статус: 🟢 (выполнено)';
                      break;

                      case 3:
                      mass_o[j+5] = 'Статус: 🔴 (время на выполнение истекло)';
                      break;

                      case 4:
                      mass_o[j+5] = 'Статус: ⚪ (ждёт проверки)';
                      break;

                    }
                    if(res[i].complete_date != null){
                      mass_o[j+6] = 'Выполнено: ' + res[i].complete_date.toLocaleDateString() + '\n----------------------\n';
                    } else mass_o[j+6] = '\n----------------------\n';
                    str = mass_o.join('\n');
                  }
                  str_mass[i] = str;
                }
                ctx.replyWithHTML(str_mass.join(''), Markup.inlineKeyboard([
                  [Markup.button.callback('Назад', 'back')]
                ]));
                // console.log(str_mass);
              }

            });
            return 0;
          }

          console.log('Create task from admin');
          let now = moment().format("YYYY/MM/DD");
          let point = ctx.update.message.text;


          let mass_of = [now, point, '-', null];

          connection.query("INSERT INTO task(`create_date`, `point`, `status`, `responsible`, `dead_line`) VALUES(?, ?, 0, ?, ?)", mass_of, (err) => {
            if(err) console.log(err);
          });

          connection.query("SELECT chat_id FROM user WHERE access_modifier = 2", (err, results) => {
            if(err) console.log(err);
            else{
              if(results.length == 0){
                return 0;
              }
              let id = Number(results[0].chat_id);
              fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${id}&text=Новое+задание+ждёт+добавления.+Проверьте+список+заданий.`, (error) => {
                if(error) console.error('error:', error);
              });
            }
          });

          ctx.replyWithHTML('Задание добавлено');
          return 0;

        } else if(results[0].access_modifier == 2){

          let mass = ctx.update.message.text.split(' ');

          if(typeof mass[1] == 'undefined'){

            console.log('Send to check task from disp');
            connection.query("SELECT status FROM task WHERE id = ?", mass[0], (err, res) => {
              if(err){
                console.log(err); return 0;
              } else{
                if(res[0].status == 0){
                  ctx.replyWithHTML('Вы написали не все данные, повторите действие');
                  return 0;
                } else{
                  let num = Number(mass[0]);

                  connection.query("UPDATE task SET status = 4 WHERE id = ?", num, (err) => {
                    if(err) console.log(err);
                  })

                  connection.query("SELECT chat_id FROM user WHERE access_modifier = 1", (err, results) => {
                    if(err) console.log(err);
                    else{

                      if(results.length == 0){
                        return 0;
                      }

                      let id = Number(results[0].chat_id);

                      fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${id}&text=Новое+задание+ждёт+проверки.+Проверьте+список+заданий.`, (error) => {
                        if(error) console.error('error:', error);
                      });
                    }
                  });

                  ctx.replyWithHTML('Задание отправлено на проверку');
                  return 0;
                }
              }
            });
            return 0;
          }

          console.log('Update task from disp');
          mass[0] = Number(mass[0]);
          let mydate = mass[1];
          mydate = new Date(mydate.replace(/(\d+).(\d+).(\d+)/, '$1/$2/$3'));
          mass[2] = mass[2] + ' ' + mass[3] + ' ' + mass[4];
          mass_1 = [mydate, mass[2], mass[0]];

          connection.query("UPDATE task SET dead_line = ?, responsible = ?, status = 1 WHERE id = ?", mass_1, (err) => {
            if(err) console.log(err);
          });

          ctx.replyWithHTML('Задание обновлено');

        } else ctx.reply('Вы попытались редактировать задания, но у вас нет прав доступа');
      }
    });
  });
}


// отправление бд в виде excel файла
bot.command('dump', (ctx) => {

  ctx.replyWithHTML('Статус задания определяется следующим образом:\n\n0 - 🔵 (не добавлено)\n1 - 🟡 (в процессе выполнения)\n2 - 🟢 (выполнено)\n3 - 🔴 (время на выполнение истекло)\n4 - ⚪ (ждёт проверки)', Markup.inlineKeyboard([Markup.button.callback('Назад', 'back')]));

  var filename = "all_" + Math.floor(Math.random() * 99999999) + ".xlsx";
  connection.query("SELECT * FROM task", (error, results) => {
    // (C1) EXTRACT DATA FROM DATABASE
    if (error) throw error;
    let data = [];
    data.push(["id", "Дата создания", "Задание", "Ответственный", "Срок сдачи", "Статус", "Фактический срод сдачи"]);
    results.forEach(row => {
      data.push([row["id"], row["create_date"], row["point"], row["responsible"], row["dead_line"], row["status"], row["complete_date"]]);
    });

    // (C2) WRITE TO EXCEL FILE
    let worksheet = xlsx.utils.aoa_to_sheet(data),
    workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Tasks");
    xlsx.writeFile(workbook, filename);
    ctx.telegram.sendDocument(ctx.message.chat.id, Input.fromLocalFile(filename));
    setTimeout(() => {
      fs.unlinkSync(process.cwd() + "/" + filename);
    }, 500);
  });

  var filename_1 = "all_bad_" + Math.floor(Math.random() * 99999999) + ".xlsx";
  connection.query("SELECT * FROM task_bad", (error, results) => {
    // (C1) EXTRACT DATA FROM DATABASE
    if (error) throw error;
    let data = [];
    data.push(["id", "Номер задания", "Задание"]);
    results.forEach(row => {
      data.push([row["id"], row["num_bad"], row["point"]]);
    });

    // (C2) WRITE TO EXCEL FILE
    let worksheet = xlsx.utils.aoa_to_sheet(data),
    workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Tasks");
    xlsx.writeFile(workbook, filename_1);
    ctx.telegram.sendDocument(ctx.message.chat.id, Input.fromLocalFile(filename_1));
    setTimeout(() => {
      fs.unlinkSync(process.cwd() + "/" + filename_1);
    }, 500);
  });
});


// обработка команды старт
bot.start(async(ctx) => {

  let chatId = ctx.message.chat.id;

  connection.query("SELECT * FROM user", function(err, results){
    if(err) console.log(err);

    if(results == null){
      connection.query("INSERT INTO user(`chat_id`, `access_modifier`) VALUES(?, 0)", ctx.message.chat.id, function(err, results) {
        if(err) console.log('В первое подключение' + err);
        else console.log("Данные добавлены");
      });
    }

    let chek_reg = false;
    for(let i = 0; i < results.length; i++){
      if(ctx.message.chat.id == results[i].chat_id){
        chek_reg = true;
      }
    }

    if(chek_reg == false){
      connection.query("INSERT INTO user(`chat_id`, `access_modifier`) VALUES(?, 0)", ctx.message.chat.id, function(err, results) {
        if(err) console.log(err);
        else console.log("Данные добавлены");
        try{
          ctx.replyWithHTML('<b>Выберите Ваш статус</b>', Markup.inlineKeyboard([
            [Markup.button.callback('Администратор', 'btn_adm'), Markup.button.callback('Диспетчер', 'btn_disp')],
            [Markup.button.callback('Пользователь', 'btn_user')]
          ]));

        } catch(e){
          console.error(e);
        }
      });
    } else{
      // console.log('Пользователь уже есть');
      try{
        connection.query("SELECT access_modifier FROM user WHERE chat_id = ?", ctx.from.id, function(err, results){
          if(err) console.log(err);
          else{
            if(results[0].access_modifier == 1){
              ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
                [Markup.button.callback('🔵 Добавить задание', 'btn_adm_task_add')],
                [Markup.button.callback('Список заданий', 'btn_task_watch'), Markup.button.callback('🔴 Невыполненные', 'btn_bad_task')],
                [Markup.button.callback('⚪ Проверить задание', 'btn_task_chek'), Markup.button.callback('Статистика', 'statistic')],
                [Markup.button.callback('Задания с * по *', 'btn_adm_task_sort')]
              ]));
            } else if(results[0].access_modifier == 2){
              ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
                [Markup.button.callback('🔵 Начать выполнять задание', 'btn_disp_task_up')],
                [Markup.button.callback('Список всех заданий', 'btn_task_watch')],
                [Markup.button.callback('🟡 Выполнить задание', 'btn_disp_task_finish')]
              ]));
            } else if(results[0].access_modifier == 0){
              ctx.replyWithHTML('<b><i>Выберите действие</i></b>', Markup.inlineKeyboard([
                [Markup.button.callback('Посмотреть список заданий', 'btn_task_watch')]
              ]));
            }
          }
        });
      } catch(e){
        console.log(e);
      }
      try{
        ctx.replyWithHTML('<b>Выберите Ваш статус</b>', Markup.inlineKeyboard([
          [Markup.button.callback('Администратор', 'btn_adm'), Markup.button.callback('Диспетчер', 'btn_disp')],
          [Markup.button.callback('Пользователь', 'btn_user')]
        ]));

      } catch(e){
        console.error(e);
      }
    }

  });

});


// второй слой, ветвление пользователей и их возможности
bot.use(async(ctx, next) => {

  try{
    if (ctx.callbackQuery) {

      // console.log(ctx.update.callback_query.message);
      ctx.deleteMessage(ctx.update.callback_query.message.message_id, ctx.update.callback_query.message.chat.id);
      await ctx.answerCbQuery();
      if(ctx.callbackQuery.data == 'btn_adm'){
        connection.query("UPDATE user SET access_modifier = 1 WHERE chat_id = ?", ctx.from.id, function(err, results){
              if(err) console.log(err);
        });
        await ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
          [Markup.button.callback('🔵 Добавить задание', 'btn_adm_task_add')],
          [Markup.button.callback('Список заданий', 'btn_task_watch'), Markup.button.callback('🔴 Невыполненные', 'btn_bad_task')],
          [Markup.button.callback('⚪ Проверить задание', 'btn_task_chek'), Markup.button.callback('Статистика', 'statistic')],
          [Markup.button.callback('Задания с * по *', 'btn_adm_task_sort')]
        ]));
      }
      else if (ctx.callbackQuery.data == 'btn_disp'){
        connection.query("UPDATE user SET access_modifier = 2 WHERE chat_id = ?", ctx.from.id);
        await ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
          [Markup.button.callback('🔵 Начать выполнять задание', 'btn_disp_task_up')],
          [Markup.button.callback('Список всех заданий', 'btn_task_watch')],
          [Markup.button.callback('🟡 Выполнить задание', 'btn_disp_task_finish')]
        ]));
      }
      else if(ctx.callbackQuery.data == 'btn_user'){
        connection.query("UPDATE user SET access_modifier = 0 WHERE chat_id = ?", ctx.from.id);
        await ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
          [Markup.button.callback('Посмотреть список заданий', 'btn_task_watch')]
        ]));
      }
    }
  } catch(e){
    console.log(e);
  }


  return next();
});


// третий слой
bot.use(async (ctx, next) =>{

  try {
    if(ctx.callbackQuery){
      await ctx.answerCbQuery();
      if(ctx.callbackQuery.data == 'btn_task_watch' || ctx.callbackQuery.data == 'pag_back_btn_task_watch' || ctx.callbackQuery.data == 'pag_forward_btn_task_watch'){

        connection.query("SELECT * FROM task", (err, results) => {
          if(err) console.log(err);
          else if(results == ''){
            ctx.replyWithHTML('Нет доступных заданий', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));

          } else{
            if(ctx.callbackQuery.data == 'btn_task_watch'){

              pagination_num = 1;

              connection.query("SELECT * FROM task ORDER BY id DESC LIMIT 1", (err, result) => {
                if(err) console.log(err);

                pagination_page = Math.ceil(result[0].id/5);
                pagination_page1 = pagination_page;

                let spisok = listPrintAll(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_task_watch'), Markup.button.callback(`${pagination_page1}/${pagination_page}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_task_watch')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });

            } else if(ctx.callbackQuery.data == 'pag_back_btn_task_watch'){

              pagination_num++;
              pagination_page1--;

              connection.query("SELECT * FROM task ORDER BY id DESC LIMIT 1", (err, result) => {
                if(err) console.log(err);

                let spisok = listPrintAll(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_task_watch'), Markup.button.callback(`${pagination_page1}/${pagination_page}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_task_watch')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });

            } else if(ctx.callbackQuery.data == 'pag_forward_btn_task_watch'){

              pagination_num--;
              pagination_page1++;

              connection.query("SELECT * FROM task ORDER BY id DESC LIMIT 1", (err, result) => {
                if(err) console.log(err);

                let spisok = listPrintAll(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_task_watch'), Markup.button.callback(`${pagination_page1}/${pagination_page}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_task_watch')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });
            }
          }
        });


      } else if(ctx.callbackQuery.data == 'btn_disp_task_up'){
        connection.query("SELECT id, point FROM task WHERE status = 0", (err, results) => {
          if(err) console.log(err);
          else if(results == ''){
            ctx.replyWithHTML('Нет доступных заданий', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));

          } else{
            let str_mass = [];

            for(let i = 0; i < results.length; i++){
              let mass = [];
              let str = '';
              for(let j = 0; j < 1; j++){
                mass[j] = 'Номер задания: ' + results[i].id;
                mass[j+1] = 'Задание: ' + results[i].point + '\n ----------- \n';
                str = mass.join('\n');
              }
              str_mass[i] = str;
            }
            ctx.replyWithHTML(`${str_mass.join('')}` + '\n<b>Введидте номер, срок выполнения задания и ФИО ответственного, которую хотите добавить.\n\n<i>Пример: 4 2023.09.29 Иванов Павел Семёнович</i></b>', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));
            message_process();
          }
        });

      } else if(ctx.callbackQuery.data == 'btn_adm_task_add'){
        let today = new Date();
        let point;
        await ctx.replyWithHTML('Введите описание задания, которое хотите добавить.', Markup.inlineKeyboard([
          [Markup.button.callback('Назад', 'back')]
        ]));
        message_process();
        // ctx.callbackQuery = 'btn_adm';
      } else if(ctx.callbackQuery.data == 'btn_disp_task_finish'){
        connection.query("SELECT id, point, status FROM task WHERE status = 1 AND 3", (err, results) => {
          if(err) console.log(err);
          else if(results == ''){
            ctx.replyWithHTML('Нет доступных заданий', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));

          } else{
            let str_mass = [];

            for(let i = 0; i < results.length; i++){
              let mass = [];
              let str = '';
              for(let j = 0; j < 1; j++){
                mass[j] = 'Номер задания: ' + results[i].id;
                mass[j+1] = 'Задание: ' + results[i].point;
                switch (results[i].status) {

                  case 1:
                    mass[j+2] = 'Статус: 🟡 (в процессе выполнения)' + '\n ----------- \n';
                    break;

                  case 3:
                    mass[j+2] = 'Статус: 🔴 (время на выполнение истекло)' + '\n ----------- \n';
                    break;

                }
                str = mass.join('\n');
              }
              str_mass[i] = str;
            }
            ctx.replyWithHTML(`${str_mass.join('')}` + '\n<b>Введидте номер задания, которое выполнено.</b>', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));
            message_process();
          }
        });

      } else if(ctx.callbackQuery.data == 'btn_bad_task' || ctx.callbackQuery.data == 'pag_back_btn_bad_task' || ctx.callbackQuery.data == 'pag_forward_btn_bad_task'){
        connection.query("SELECT id, point, status FROM task WHERE status = 3", (err, results) => {
          if(err) console.log(err);
          else if(results == ''){
            ctx.replyWithHTML('Нет просроченных заданий заданий', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));

          } else{

            if(ctx.callbackQuery.data == 'btn_bad_task'){

              pagination_num_bad = 1;

              connection.query("SELECT * FROM task WHERE status = 3", (err, result) => {
                if(err) console.log(err);

                pagination_page_bad = Math.ceil(result.length/5);
                pagination_page1_bad = pagination_page_bad;

                let spisok = listPrintRed(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_bad_task'), Markup.button.callback(`${pagination_page1_bad}/${pagination_page_bad}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_bad_task')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });
            } else if(ctx.callbackQuery.data == 'pag_back_btn_bad_task'){

              pagination_num_bad++;
              pagination_page1_bad--;

              connection.query("SELECT * FROM task WHERE status = 3 ORDER BY id DESC LIMIT 1", (err, result) => {
                if(err) console.log(err);

                let spisok = listPrintRed(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_bad_task'), Markup.button.callback(`${pagination_page1_bad}/${pagination_page_bad}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_bad_task')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });
            } else if(ctx.callbackQuery.data == 'pag_forward_btn_bad_task'){

              pagination_num_bad--;
              pagination_page1_bad++;

              connection.query("SELECT * FROM task WHERE status = 3 ORDER BY id DESC LIMIT 1", (err, result) => {
                if(err) console.log(err);

                let spisok = listPrintRed(results);

                ctx.replyWithHTML(`${spisok.join('')}`, Markup.inlineKeyboard([
                  [Markup.button.callback('<', 'pag_back_btn_bad_task'), Markup.button.callback(`${pagination_page1_bad}/${pagination_page_bad}`, 'back'), Markup.button.callback('>', 'pag_forward_btn_bad_task')],
                  [Markup.button.callback('Назад', 'back')]
                ]));
              });
            }
          }
        });
      } else if(ctx.callbackQuery.data == 'btn_task_chek'){
        connection.query("SELECT id, point, status FROM task WHERE status = 4", (err, results) => {
          if(err) console.log(err);
          else if(results == ''){
            ctx.replyWithHTML('Нет доступных заданий', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));

          } else{

            console.log('watch');

            let str_mass = [];

            for(let i = 0; i < results.length; i++){
              let mass = [];
              let str = '';
              for(let j = 0; j < 1; j++){
                mass[j] = 'Номер задачи: ' + results[i].id;
                mass[j+1] = 'Задание: ' + results[i].point;
                mass[j+2] = 'Статус: ⚪ (ждёт проверки)' + '\n ----------- \n';
                str = mass.join('\n');
              }
              str_mass[i] = str;
            }
            ctx.replyWithHTML(`${str_mass.join('')}` + '\n<b>Введидте номер задания, которое проверено.</b>', Markup.inlineKeyboard([
              [Markup.button.callback('Назад', 'back')]
            ]));
            message_process();
          }
        });
      } else if(ctx.callbackQuery.data == 'statistic'){

        let mass = [];

        connection.query("SELECT id FROM task WHERE status = 2", (err, results) => {
          connection.query("SELECT id FROM task_bad", (err, result) => {
            connection.query("SELECT id FROM task WHERE status = 1", (err, resul) => {
              ctx.replyWithHTML(`Количество заданий, которые были хотя-бы один раз не выполнены в срок: ${result.length}\n-----------\nКоличество выполненных заданий: ${results.length}\n-----------\nКоличество выполняемых в данный момент заданий: ${resul.length}`, Markup.inlineKeyboard([[Markup.button.callback('Назад', 'back')]]));
              console.log('Statistic');
            });
          });
        });


      } else if(ctx.callbackQuery.data == 'btn_adm_task_sort'){
        ctx.replyWithHTML('Введите период, за который хотите посмотреть задания\n\nПример: 2001.12.29 2002.11.28', Markup.inlineKeyboard([
          [Markup.button.callback('Назад', 'back')]
        ]));
        message_process();
      }
      else if(ctx.callbackQuery.data == 'back'){
        try{
          connection.query("SELECT access_modifier FROM user WHERE chat_id = ?", ctx.from.id, function(err, results){
            if(err) console.log(err);
            else{
              if(results[0].access_modifier == 1){
                ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
                  [Markup.button.callback('🔵 Добавить задание', 'btn_adm_task_add')],
                  [Markup.button.callback('Список заданий', 'btn_task_watch'), Markup.button.callback('🔴 Невыполненные', 'btn_bad_task')],
                  [Markup.button.callback('⚪ Проверить задание', 'btn_task_chek'), Markup.button.callback('Статистика', 'statistic')],
                  [Markup.button.callback('Задания с * по *', 'btn_adm_task_sort')]
                ]));
              } else if(results[0].access_modifier == 2){
                ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
                  [Markup.button.callback('🔵 Начать выполнять задание', 'btn_disp_task_up')],
                  [Markup.button.callback('Список всех заданий', 'btn_task_watch')],
                  [Markup.button.callback('🟡 Выполнить задание', 'btn_disp_task_finish')]
                ]));
              } else if(results[0].access_modifier == 0){
                ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard([
                  [Markup.button.callback('Посмотреть список заданий', 'btn_task_watch')]
                ]));
              }
            }
          });
        } catch(e){
          console.log(e);
        }
      }

    }
  } catch (e) {
    console.log(e);
  }
  return next();

});


// четвёртый слой
bot.use(async (ctx, next) =>{
  try{

    if(ctx.callbackQuery){

      ctx.answerCbQuery();

      if(ctx.callbackQuery.data == 'task_good'){
        let now = moment().format("YYYY/MM/DD");
        let mass_2 = [now, num_task];
        connection.query("UPDATE task SET status = 2, complete_date = ? WHERE id = ?", mass_2, (err) => {
          if(err) console.log(err);
        });

        ctx.replyWithHTML('Задание обновлено');

      } else if(ctx.callbackQuery.data == 'task_bad'){
        connection.query("UPDATE task SET status = 3 WHERE id = ?", num_task, (err) =>{
          if(err) console.log(err);
        });

        ctx.replyWithHTML('Задание обновлено');
      }
    }
  } catch(e){
    console.log(e);
  }

  return next();
});


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
