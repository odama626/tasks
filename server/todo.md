# msgpack and encrypt payloads
- header should be json, body should be blob
- body is always encrypted -- treat like file
- for federation, just forward to all recipients' servers


example 
```
{
  from: 'adam@lilbyte.dev' // lookup user to verify signature
  to: [
    'amanda@lilbyte.dev' // goes to amandas inbox
    'brandon@brandonville.com' // entire payload gets forwarded to brandonville.com server
  ],
  event: 'create' // what type of event is this? create / delete / update
  model: 'document', // the datastructure that is affected
  body: `asdfasdfasf` // binary -- encrypted based on reference [2]
}
```

# References
1. double ratchet messaging - https://www.youtube.com/watch?v=9sO2qdTci-s
2. group messages (more than 2 people) - https://www.youtube.com/watch?v=Q0_lcKrUdWg
