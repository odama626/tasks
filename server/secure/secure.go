package secure

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"fmt"

	"golang.org/x/crypto/argon2"

	"crypto/rsa"
)

func GenerateSalt(size uint) ([]byte, error) {
	b := make([]byte, size)

	_, err := rand.Read(b)

	return b, err
}

func Hash(password []byte, salt []byte) []byte {
	return argon2.IDKey(password, salt, 1, 64*1024, 4, 32)
}

func EncryptWithPassword(password []byte, salt []byte, iv []byte, data []byte) ([]byte, error) {
	key := Hash(password, salt)
	fmt.Println("hashed")
	block, err := aes.NewCipher(key)

	fmt.Println("new cypher")

	if err != nil {
		return []byte{}, err
	}

	defer func() {
		if x := recover(); x != nil {
			fmt.Println(x)
			panic(x)
		}
	}()

	mode := cipher.NewCBCEncrypter(block, iv)

	output := make([]byte, cap(data))

	fmt.Println("crypt")

	mode.CryptBlocks(output, data)

	fmt.Println("wtf")
	return output, nil
}

func CreateKeyPair() (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, 2048)

	// x509.MarshalPKCS8PrivateKey(privateKey)
}

type KeyStore struct {
	PrivateKey   *rsa.PrivateKey
	Salt         []byte
	EncryptedKey []byte
}
