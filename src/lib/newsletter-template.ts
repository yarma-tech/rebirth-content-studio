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
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                IA Friday
              </h1>
              <p style="margin:4px 0 0;color:#a1a1aa;font-size:14px;">
                Le recap IA de la semaine — par Yannick Maillard
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              <div style="color:#27272a;font-size:16px;line-height:1.6;">
                ${content}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;">
              <p style="margin:0 0 8px;color:#71717a;font-size:13px;">
                Tu recois cet email car tu t'es inscrit(e) a IA Friday.
              </p>
              <p style="margin:0 0 16px;color:#71717a;font-size:13px;">
                <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline;">Se desinscrire</a>
              </p>
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                Yannick Maillard — Montreal, QC
                <br>
                <a href="https://www.linkedin.com/in/yannick-maillard" style="color:#a1a1aa;">LinkedIn</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
