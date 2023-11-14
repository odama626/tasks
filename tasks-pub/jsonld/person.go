package jsonld

type PublicKey struct {
	Id           string `json:"id"`
	Owner        string `json:"owner"`
	PublicKeyPem string `json:"publicKeyPem"`
}

type UserLd struct {
	Context           []string          `json:"@context"`
	Id                string            `json:"id"`
	Type              string            `json:"type"`
	PreferredUsername string            `json:"preferredUsername"`
	Inbox             string            `json:"inbox"`
	Outbox            string            `json:"outbox"`
	Endpoints         map[string]string `json:"endpoints"`
	PublicKey         PublicKey         `json:"publicKey"`
}
