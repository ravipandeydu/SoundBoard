# SoundBoard

A lightweight web app for remote musicians to record short audio loops, layer tracks, and collaborate in real time—no complicated DAWs required.

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Architecture & Data Model](#architecture--data-model)  
4. [Tech Stack](#tech-stack)  
5. [Getting Started](#getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Installation](#installation)  
   - [Environment Variables](#environment-variables)  
   - [Running Locally](#running-locally)  
6. [Usage](#usage)  
   - [Creating a Jam Room](#creating-a-jam-room)  
   - [Recording & Managing Loops](#recording--managing-loops)  
   - [Mixdown & Export](#mixdown--export)  
   - [Inviting Collaborators](#inviting-collaborators)  
7. [API Reference](#api-reference)  
8. [Folder Structure](#folder-structure)  
9. [Contributing](#contributing)  
10. [License](#license)  

---

## Overview

SoundBoard lets you spin up a “Jam Room,” record up to 30-second audio loops, layer and mix them in-browser, and share with other musicians in real time. It’s built for quick, collaborative creativity without the overhead of a full digital audio workstation.

---

## Features

- **Jam Rooms**: Create public or private rooms with custom titles, BPM, and key signature  
- **Loop Recording**: Record up to 30-second loops directly in the browser via Web Audio API  
- **Loop Management**: Enable/disable loops, adjust per-loop volume, and view who recorded each loop and when  
- **Collaborative Sync**: Auto-poll for new loops every 5 seconds—no page refresh needed  
- **Export Mixdown**: Concatenate active loops back-to-back into a single WAV file and download  
- **Invite System**: Hosts can invite collaborators via a shareable room code or link  
- **Profile Analytics**: Track total rooms hosted, loops recorded, and mixdown exports on your user profile  

---

## Architecture & Data Model

### Jam Room

- `id: string`  
- `title: string`  
- `bpm: number`  
- `keySignature: string`  
- `hostId: string`  
- `isPublic: boolean`  

### Loop

- `id: string`  
- `roomId: string`  
- `userId: string`  
- `url: string` (audio/webm blob)  
- `order: number`  
- `enabled: boolean`  
- `volume: number`  
- `createdAt: Date`  

### Mixdown

- `id: string`  
- `roomId: string`  
- `url: string` (audio/wav blob)  
- `createdAt: Date`  

---

## Tech Stack

- **Frontend**  
  - Next.js 14 (App Router)  
  - React + SWR for data fetching  
  - Tailwind CSS + shadcn/ui for styling & components  
- **Backend**  
  - Next.js API Routes (Node.js)  
  - Prisma ORM + PostgreSQL (or your choice of database)  
- **Auth**  
  - NextAuth.js for session management  
- **Audio**  
  - Web Audio API (MediaRecorder & OfflineAudioContext)  
- **Storage**  
  - File uploads via `/api/loops` (FormData → database or object storage)  
  - Mixdown records via `/api/mixdowns`  

---

## Getting Started

### Prerequisites

- Node.js v18+  
- Yarn or npm  
- PostgreSQL (or another SQL database)  

### Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-org/soundboard.git
   cd soundboard
Install dependencies

bash
Copy
Edit
yarn install
# or
npm install
Set up your database

bash
Copy
Edit
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev --name init
Environment Variables
Copy .env.example to .env and fill in:

dotenv
Copy
Edit
DATABASE_URL=postgresql://user:pass@localhost:5432/soundboard
NEXTAUTH_SECRET=your_nextauth_secret
# (Optional) STORAGE_PROVIDER=local|s3|r2
Running Locally
bash
Copy
Edit
npm run dev
# or
yarn dev
Open http://localhost:3000 in your browser.

Usage
Creating a Jam Room
Click Create Room

Enter a title, BPM, key signature, and choose public/private

Share the room code/link with collaborators

Recording & Managing Loops
Click Record to start a 30-second capture

After recording stops, your loop appears in the list

Toggle Enabled or adjust the volume slider for each loop

Collaborators see new loops appear automatically

Mixdown & Export
Select which loops are Enabled

Click Export Mixdown

Download your stitched-together WAV file

A record of this mix is saved under /api/mixdowns

Inviting Collaborators
As the host, click Invite to open the invite modal

Copy the room code or link and share

API Reference
Rooms
GET /api/rooms/:roomId
Fetch room metadata

PATCH /api/rooms/:roomId
Toggle { isPublic: boolean }

Loops
GET /api/loops?roomId={roomId}
List loops in a room

POST /api/loops
Upload a new loop

text
Copy
Edit
FormData:
  - file: Blob (audio/webm)
  - roomId: string
  - name: string
  - order: number
PATCH /api/loops/:loopId
Update { enabled: boolean, volume: number }

Mixdowns
POST /api/mixdowns
Record a mix

json
Copy
Edit
{
  "roomId": "string",
  "url": "string"
}
Folder Structure
bash
Copy
Edit
/app
  /api
    rooms/
    loops/
    mixdowns/
  /rooms
    create/
    [roomId]/
      page.tsx        # Room UI + SWR hooks
      InviteModal.tsx
  /signup
    page.tsx
    SignupForm.tsx
  /login
    page.tsx
    LoginForm.tsx
/lib
  prisma.ts           # Prisma client
  audio.ts            # WAV encoder util
/components
  ui/                 # shadcn/ui overrides
