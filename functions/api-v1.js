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
    admin.database().ref('AtEYfN8PrqdYI602FiZgrHL5SOp2' + '/nodes').once('value').then(async (data) => {
      return res.send(data.val());
    })
  );

  // Expose Express API as a single Cloud Function:
  return functions.https.onRequest(app);
}
