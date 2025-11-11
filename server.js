// server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
// import fetch from 'node-fetch'; // décommente si ton Node n'a pas fetch

const app = express();
const PORT = process.env.PORT || 3000;

// ton script Google Sheet
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// on prépare le transport mail, mais il peut être incomplet si les vars ne sont pas mises
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
  tls: { rejectUnauthorized: false },
  // on met un timeout court pour ne pas bloquer
  connectionTimeout: 5000,
});

app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body || {};
  console.log('📥 Reçu du front :', req.body);

  if (!nom || !email) {
    return res.status(400).json({ ok: false, error: 'nom et email requis' });
  }

  // 1️⃣ on essaye d'abord d'écrire dans le Google Sheet (c'est ce qui marche chez toi)
  let sheetOk = false;
  try {
    const resp = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });
    if (!resp.ok) throw new Error('Réponse Google Script non OK');
    console.log('✅ Données envoyées au Google Sheet');
    sheetOk = true;
  } catch (err) {
    console.error('❌ Erreur envoi Google Sheet :', err.message);
  }

  // 2️⃣ on répond tout de suite au navigateur (pour que ton Hostinger n’attende pas 15s)
  res.json({
    ok: sheetOk,           // si le sheet est bon → le front peut rediriger Telegram
    sheetOk,
    mailOk: false,         // on ne sait pas encore
    info: 'mail en arrière-plan',
  });

  // 3️⃣ on fait l’envoi Zoho APRÈS avoir répondu (si les vars existent)
  if (process.env.ZOHO_USER && process.env.ZOHO_PASS) {
    try {
      await transporter.sendMail({
        from: process.env.ZOHO_USER,
        to: process.env.ZOHO_USER,
        subject: `Nouveau message de ${nom}`,
        html: `
          <p><b>Nom :</b> ${nom}</p>
          <p><b>Prénom :</b> ${prenom || '(non renseigné)'}</p>
          <p><b>Email :</b> ${email}</p>
          <p><b>Message :</b><br>${(message || '').replace(/\n/g, '<br>')}</p>
        `,
      });
      console.log('✅ Email Zoho envoyé (après réponse)');
    } catch (err) {
      console.error('❌ Erreur envoi Zoho (après réponse) :', err.message);
    }
  } else {
    console.log('⚠️ Pas de ZOHO_USER/ZOHO_PASS définis, mail non envoyé.');
  }
});

app.get('/', (req, res) => {
  res.send('SmartTrader form API is running ✅');
});

app.listen(PORT, () => {
  console.log('🚀 Serveur démarré sur le port ' + PORT);
});



