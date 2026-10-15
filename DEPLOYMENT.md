# GitHub Pages 与用户登录

- 仓库：`jxx4600-prog/amiao-post-office`，只上传应用代码、公开素材和 SDK 授权；不上传私人记录、验收截图或作品集其他文件。
- Pages 来源：`main` 分支的 `/docs`。首次需在仓库 Settings → Pages 中保存这个来源。
- 目标网址：`https://jxx4600-prog.github.io/amiao-post-office/`，必须实际访问成功后才视为部署完成。
- Supabase：`https://srkadrkxshiozfgdvzhv.supabase.co`。前端只使用 Publishable key，不使用管理员或数据库凭据。
- 身份验证使用固定版本的官方 Supabase SDK 2.117.3，MIT 授权文件在 vendor。登录为邮箱一次性链接和 PKCE；在原浏览器、同一站点打开链接。URL Configuration 的 Site URL 和 Redirect URLs 均配置上述 Pages 地址。
- 登录入口在“我的”顶部。访客不强制注册。首次邮箱验证后创建用户；支持退出登录和 JSON 本地备份。
- 登录身份用服务端 getUser 验证后确定。不同账号使用不同本地记录键；访客原有 `miao-refined-v1` 记录不覆盖、不自动上传。
- 当前没有跨设备云同步，也没有云数据库表。不要把前端账号分区视为共享电脑上的数据加密或访问控制；使用后退出账号并妥善管理浏览器。
- Supabase 默认邮件服务只允许项目组织成员收件且有严格限额。对外开放注册前，必须在 Supabase 配置自己的 SMTP，并按需启用验证码和服务端限流；不要关闭邮箱确认来绕过邮件配置。
- 本地预览不发送登录邮件，以免 PKCE 验证码存储在 localhost 而回跳到 GitHub Pages。
- 不提交用户的密码、登录链接、访问令牌、service_role、Secret key 或数据库密码。

参考：https://supabase.com/docs/guides/auth/auth-email-passwordless 和 https://supabase.com/docs/guides/auth/auth-smtp