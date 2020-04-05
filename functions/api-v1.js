exports.aims = function (functions, admin) {
  const express = require('express');
  const cors = require('cors');
  const app = express();
  // Automatically allow cross-origin requests
  app.use(cors({ origin: true }));

  // Add middleware to authenticate requests
  // app.use(myMiddleware);

  // build multiple CRUD interfaces:
  // app.get('/:id', (req, res) => res.send(Widgets.getById(req.params.id)));
  // app.post('/', (req, res) => res.send(Widgets.create()));
  // app.put('/:id', (req, res) => res.send(Widgets.update(req.params.id, req.body)));
  // app.delete('/:id', (req, res) => res.send(Widgets.delete(req.params.id)));
  // app.get('/', (req, res) => res.send(Widgets.list()));
  app.get('/', (req, res) =>
    admin.database()
      .ref('/')
      .orderByChild('userdata/nodesUpdatedAt')
      .limitToLast(10)
      .once('value')
      .then(async (data) => {
        // return res.send(data.val());
        const users = data.val()
        const usersArray = []
        if (users) {
          // Get task key (id)
          Object.keys(users).forEach(key => {
            const u = users[key]
            const nodes = u.nodes
            const nodesArray = []
            if (nodes) {
              Object.keys(nodes).sort().reverse().forEach(key => {
                const n = nodes[key]
                // Если цель доступна и статус цели - не "отменено" и не "завершено"
                if (n.access && n.status !== '5' && n.status !== '6') {
                  nodesArray.push(
                    {
                      'title': n.title,
                      'description': n.description,
                      'createdAt': n.createdAt
                    }
                  )
                }
              })
            }
            const userEmail = (u.userdata) ? u.userdata.email : ('anonimous_' + (new Date()).toISOString())
            usersArray.push({[userEmail]: nodesArray})
          })
        }
        return res.send(usersArray);
      })
  );

  // Expose Express API as a single Cloud Function:
  return functions.https.onRequest(app);
}
