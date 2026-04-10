export function renderNewsletterHtml(
  content: string,
  unsubscribeUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IA Friday</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:'Roboto',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#03045e;padding:40px 40px 32px;border-radius:16px 16px 0 0;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#00b4d8;width:56px;height:56px;border-radius:14px;line-height:56px;text-align:center;">
                      <span style="font-size:28px;color:#ffffff;">&#9889;</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                      IA Friday
                    </h1>
                    <p style="margin:8px 0 0;color:#90e0ef;font-size:15px;font-weight:300;">
                      Le recap IA de la semaine pour les PME
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EDITO SECTION -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-left:4px solid #00b4d8;padding-left:20px;">
                    <p style="margin:0 0 4px;color:#0077b6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                      Edito
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:0 40px 32px;">
              <div style="color:#1a1a2e;font-size:16px;line-height:1.7;font-weight:400;">
                ${content}
              </div>
            </td>
          </tr>

          <!-- SEPARATOR -->
          <tr>
            <td style="background-color:#ffffff;padding:0 40px;">
              <div style="height:1px;background-color:#e9ecef;"></div>
            </td>
          </tr>

          <!-- CTA SECTION -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg, #caf0f8 0%, #90e0ef 100%);padding:40px;text-align:center;">
                    <h2 style="margin:0 0 12px;color:#03045e;font-size:22px;font-weight:700;">
                      Tu connais quelqu'un que ca interesserait ?
                    </h2>
                    <p style="margin:0 0 24px;color:#0077b6;font-size:15px;font-weight:400;">
                      Transfère cet email ou partage le lien d'inscription.
                    </p>
                    <a href="https://rebirth-content-studio.vercel.app/subscribe"
                       style="display:inline-block;background-color:#00b4d8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:500;">
                      S'inscrire a IA Friday
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
              <!-- Social links -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="https://www.linkedin.com/in/yannick-maillard" style="display:inline-block;width:40px;height:40px;border-radius:50%;background-color:#f8f9fa;text-align:center;line-height:40px;text-decoration:none;margin:0 6px;">
                      <span style="font-size:18px;color:#0077b6;">in</span>
                    </a>
                    <a href="https://yannick.tech" style="display:inline-block;width:40px;height:40px;border-radius:50%;background-color:#f8f9fa;text-align:center;line-height:40px;text-decoration:none;margin:0 6px;">
                      <span style="font-size:18px;color:#0077b6;">&#127760;</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Author -->
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:14px;font-weight:500;text-align:center;">
                Yannick Maillard — Vibe Coder, Montreal
              </p>

              <!-- Legal -->
              <p style="margin:0 0 8px;color:#6c757d;font-size:12px;text-align:center;line-height:1.6;">
                Tu recois cet email car tu t'es inscrit(e) a IA Friday.
              </p>

              <!-- Unsubscribe -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <a href="${unsubscribeUrl}"
                       style="display:inline-block;color:#6c757d;font-size:12px;text-decoration:none;padding:8px 20px;border:1px solid #dee2e6;border-radius:6px;">
                      Se desinscrire
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
