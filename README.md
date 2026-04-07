# 项目文档

本项目已配置自动化部署到 GitHub Pages。

## 自动化更新网页链接 (GitHub Actions)

当您将代码上传或推送到 GitHub 仓库的 `main` 或 `master` 分支时，项目会自动构建并部署到 GitHub Pages。

### 配置步骤：

1. **上传代码到 GitHub**：
   将本项目的所有文件推送到您的 GitHub 仓库。

2. **在 GitHub 仓库中启用 GitHub Pages**：
   - 进入您的 GitHub 仓库页面。
   - 点击顶部导航栏的 **Settings** (设置)。
   - 在左侧边栏中，找到并点击 **Pages**。
   - 在 **Build and deployment** (构建和部署) 部分，将 **Source** (来源) 更改为 **GitHub Actions**。

3. **查看部署状态**：
   - 点击仓库顶部的 **Actions** 标签页。
   - 您会看到名为 "Deploy to GitHub Pages" 的工作流正在运行。
   - 运行完成后，您的网页将自动更新，并在 Actions 页面或仓库主页的右侧 "Environments" 中显示您的网页链接。

### 注意事项：
- 项目中的 `vite.config.ts` 已配置 `base: './'`，以确保在 GitHub Pages 的子路径下资源能够正确加载。
- 每次向 `main` 或 `master` 分支提交代码，都会触发自动化更新。
