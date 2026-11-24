# Deploy to Railway

This portfolio uses the existing multi-stage Dockerfile: Node.js 24 builds the Vue app, and Nginx serves the built files on port **35000**. Railway builds the container remotely; a running local Docker daemon is not required. No database or persistent volume is needed.

## Deploy the local folder

Railway CLI is already installed on this computer. Run these commands in Terminal, one at a time:

```sh
cd /Users/ghazi.saoudi/Downloads/portfolio-windows
railway login
```

Complete sign-in in your browser. The previous CLI session expired, so a fresh login is needed.

Create a project and choose your Railway workspace when prompted:

```sh
railway init --name ghazi-windows-xp
```

Create the web service with the port used by nginx.conf:

```sh
railway add --service portfolio-windows --variables "PORT=35000"
```

Upload the source and deploy:

```sh
railway up --service portfolio-windows
```

Railway detects the root Dockerfile automatically. Keep custom build and start commands empty: the Dockerfile runs npm ci, npm run build and Nginx. Wait for the deployment to become active; inspect Build Logs or Deploy Logs in the dashboard if it fails.

Generate the public HTTPS address:

```sh
railway domain --service portfolio-windows --port 35000
```

Open the URL printed by Railway. The root URL shows the boot/login sequence; append /office to go directly to the desktop. Check CV page 2/search, project descriptions and images, video playback, music, and refreshing /office.

## Later updates

From the same folder, run:

```sh
railway up --service portfolio-windows
```

To inspect runtime logs:

```sh
railway logs --service portfolio-windows
```

The CLI method does not configure GitHub automatic deployments. You can later connect a repository through the service's Settings → Source. If deploying through GitHub, keep Dockerfile, nginx.conf, package files, src and public in the repository root; do not upload node_modules or dist. Set PORT=35000 and the public domain's target port to 35000.

## Optional custom domain

In the service's Settings → Networking, choose Custom Domain, enter your domain and set target port 35000. Add the DNS records Railway provides at your domain registrar and wait for verification/HTTPS provisioning.

Keep the original ghazi-saoudi.vercel.app online: the embedded original portfolio and the two on-demand project demo videos still use it.

References: [Dockerfile detection](https://docs.railway.com/services), [CLI deployment](https://docs.railway.com/cli/up), [public domains](https://docs.railway.com/networking/public-networking).
