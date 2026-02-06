# Deployment Guide

This project uses a split deployment architecture:

- **Frontend (Next.js)** → Vercel
- **Agent (Python LiveKit)** → Google VM via Docker

---

## Frontend Deployment (Vercel)

### Prerequisites

- GitHub repository connected to Vercel
- LiveKit Cloud account

### Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com) and import your repository
   - Set **Root Directory** to `web`

2. **Configure Environment Variables**
   Add these in the Vercel dashboard (Settings → Environment Variables):

   ```
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

3. **Deploy**
   - Vercel will automatically build and deploy on push to main branch
   - Build command: `npm run build` (auto-detected)

---

## Agent Deployment (Google VM + Docker)

### Prerequisites

- Google Cloud account with a VM instance (e2-small or larger recommended)
- Docker installed on the VM
- SSH access to the VM

### Steps

1. **SSH into your VM**

   ```bash
   gcloud compute ssh your-instance-name --zone=your-zone
   ```

2. **Install Docker** (if not already installed)

   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

   Log out and back in for group changes to take effect.

3. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

4. **Create Environment File**

   ```bash
   cp .env.agent.example .env.local
   nano .env.local  # Add your actual values
   ```

   Required variables:

   ```
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   OPENAI_API_KEY=your-openai-api-key
   ```

5. **Build the Docker Image**

   ```bash
   docker build -t solarx-agent .
   ```

6. **Run the Container**

   ```bash
   docker run -d \
     --name solarx-agent \
     --restart unless-stopped \
     --env-file .env.local \
     solarx-agent
   ```

7. **Verify the Agent is Running**

   ```bash
   docker logs -f solarx-agent
   ```

### Updating the Agent

```bash
git pull
docker build -t solarx-agent .
docker stop solarx-agent
docker rm solarx-agent
docker run -d \
  --name solarx-agent \
  --restart unless-stopped \
  --env-file .env.local \
  solarx-agent
```

---

## Verification

1. **Frontend**: Visit your Vercel deployment URL and verify the page loads
2. **Agent**: Check Docker logs to confirm connection to LiveKit Cloud
3. **End-to-end**: Test a voice session through the frontend

---

## Troubleshooting

### Agent not connecting to LiveKit

- Verify `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are correct
- Check Docker logs: `docker logs solarx-agent`

### Frontend connection issues

- Ensure `NEXT_PUBLIC_LIVEKIT_URL` matches the server-side `LIVEKIT_URL`
- Verify environment variables are set in Vercel dashboard
