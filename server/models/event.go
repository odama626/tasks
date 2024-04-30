package models

type Event struct {
	To []string `msgpack:"to" json:"to"`

	Payload []byte `msgpack:"payload" json:"payload"`
}
