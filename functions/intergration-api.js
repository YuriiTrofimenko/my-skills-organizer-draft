const cors = require('cors')({origin: true})
exports.addNode = function (functions, admin) {
  return functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
      // Grab the uId parameter
      const uId = req.query.uId
      // Grab the json body
      const nodeBody = req.body
      //Получение всех узлов данного пользователя
      const nodesResponse =
        await admin.database()
          .ref(uId + '/nodes')
          .once('value')
      // Get value
      const nodes = nodesResponse.val()
      //Перебирая все узлы текущего пользователя находим максимальное значение свойства top
      let maxNodeTop = 100
      if (nodes !== null) {
        maxNodeTop = nodes[Object.keys(nodes)[0]].top
        Object.keys(nodes).forEach(key => {
          const n = nodes[key]
          if (n) {
            if (n.top > maxNodeTop) {
              maxNodeTop = n.top
            }
          }
        })
        maxNodeTop += 200
      }
      // Копируем из тела сообщения от внешнего источника
      // данные в объект нового узла цели
      const node = {
        title: nodeBody.title,
        type: nodeBody.type,
        description: nodeBody.description,
        access: (nodeBody.access === "true"),
        status: nodeBody.status,
        dependenciesSatisfied: (nodeBody.dependenciesSatisfied === "true"),
        radius: parseInt(nodeBody.radius, 10),
        left: parseInt(nodeBody.left, 10),
        top: maxNodeTop
      }
      // Push the new node into the Realtime Database using the Firebase Admin SDK.
      const snapshot = await admin.database().ref(uId + '/nodes').push(node)
    
      // Setup notification
      /* const payload = {
        data: {
          msgtitle: 'New Node Added to Your SkillsOrganizer',
          msgbody: '(Title: ' + node.title + '). Review and Setting It'
        }
      } */
      // Полезная нагрузка для отправки веб-клиентам в виде уведомления
      // (структура объекта - стандартная)
      const payload = {
        "notification": {
          "title": "New Node Added to Your SkillsOrganizer",
          "body": "(Title: " + node.title + "). Review and Setting It",
          "click_action": "https://my-skills-organizer.firebaseapp.com"
        }
      }
    
      // Clean invalid tokens
      function cleanInvalidTokens (tokensWithKey, results) {
    
        const invalidTokens = []
    
        if (results) {
          results.forEach((result, i) => {
            if ( !result.error ) return
      
            console.error('Failure sending notification to', tokensWithKey[i].token, result.error)
            
            switch(result.error.code) {
              case "messaging/invalid-registration-token":
              case "messaging/registration-token-not-registered":
                invalidTokens.push(admin.database().ref(uId + '/tokens').child(tokensWithKey[i].key).remove())
                break
              default:
                break
            }
          })
        }
        return Promise.all(invalidTokens)
      }
      // Send notifications
      return admin.database().ref(uId + '/tokens').once('value').then(async (data) => {
        // Читаем из хранилища коренвой элемент с токенами,
        // затем выполняем асинхронную функцию.
        // Если токенов нет - завершаем работу функции
        if (!data.val()) return
        // Иначе - извлекаем значение элемента с токенами
        const snapshot = data.val()
        const tokensWithKey = []
        const tokens = []
        // Значение каждого токена
        for (let key in snapshot) {
          // Собираем в массив
          tokens.push(snapshot[key].token)
          // Затем - в массив елементов с токенами и их ключами
          tokensWithKey.push({
            token: snapshot[key].token,
            key: key
          })
        }
        // Send response to the client
        // res.status(200).send(snapshot.ref.toString())
        return admin.messaging().sendToDevice(tokens, payload).then(function(response) {
          // See the MessagingDevicesResponse reference documentation for
          // the contents of response.
          res.status(200).send(response)
          cleanInvalidTokens(tokensWithKey, (response) ? response.results : null)
          console.log("Successfully sent message:", response)
          return
        })
        .catch(function(error) {
          cleanInvalidTokens(tokensWithKey, (response) ? response.results : null)
          console.log("Error sending message:", error)
          res.status(500).send(response)
        })
      })
    })
  })
}