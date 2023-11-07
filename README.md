Structa
Where ideas find structure
"Your Notes, Your Structure, Your Way."

Keep track of your notes and tasks, and keep your freedom

- [Motivation](#motivation)
- [Why another Notes and Tasks App](#why-another-notes-and-tasks-app)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

## Snapshot of current roadmap (in-app)

<img src='./res/desktop-roadmap.png' >

## Motivation

There are a lot of other things out there, but all of them have drawbacks, here are a few I've tried

- Todoist -- everything is slowly becoming paid and they own all your data?
- Notion -- man that privacy policy is scary
- Oblivion -- another propetairy thing? paid sync?

why are these all _almost_ usable but they all have at least one **major flaw**, and why do the only tend to get **worse over time**?
I was kind of fed up

## Why another Notes and Tasks App

I realized that there are a couple of things I want out of an appplication like this, and there are a couple of non-negotiables

- non-proprietary -- this is my data, fuck your terms of service
- mobile and desktop
- offline first -- I need my notes, even if I'm in the woods
- collaborative editing
- sharing by link is a must
- no single point of failure
- I need all this stuff to sync between my devices too

Realizing that this didn't exist, and all of the times in my past that I have needed this application, I realized I was done waiting for someone else to buid it.

So, how do I hope to achieve all of this?

- non-proprietary -- easy -- AGPL 3 tried and true
- mobile and desktop -- a pwa seems like common sense
- offline first -- service workers and indexedDb with eager caching
- collaborative editing - yjs and webrtc
- sharing - a user model with invite links
- no single point of failure - (plans to implement ActivityPub)
- sync - currently pocketbase subscriptions and eager caching

## Screenshots

An assortment of desktop and mobile screenshots from the res folder

Collaboration
<img src='./res/collaboration.png'>

Image Attachments
<img src='./res/attachments.png'>

Quick Actions
<img src='./res/actions.png'>

Rich Editing
<img src='./res/rich-editing.png'>

## Contributing

### the main app

- to run the main app you need to setup pocketbase locally

```sh
docker compose up
```

- navigate to http://localhost:8090 and setup your admin account

- import the schema
  - go to settings > import collections and load the file at ./src/lib/collection.json

- you then need make your env file

```sh
cp .env.defaults .env

# install dependencies and start the app
pnpm install
pnpm dev
```

- navigate to http://localhost:5173 and create your account

- get hacking!

### yjs-signaling-server

this is a very basic server that just handles signaling for document collaboration and normally shouldn't need to be run, and the app is currently hardcoded to point to the production one

```
cd ./yjs-signaling-server

pnpm install
pnpm dev
```
