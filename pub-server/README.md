```

#running in dev mode
docker compose --profile dev up

# you may need to initialized your database with this command
psql -Atx postgresql://user:admin@localhost:5432 -c "create Database pub_server" 


#then start the dev server
deno task dev
```


```
```
