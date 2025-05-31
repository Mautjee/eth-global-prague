// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package message_box

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// MessageBoxMetaData contains all meta data concerning the MessageBox contract.
var MessageBoxMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"name\":\"author\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"message\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"in_message\",\"type\":\"string\"}],\"name\":\"setMessage\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
	Bin: "0x6080604052348015600f57600080fd5b506103fa8061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063368b877214610046578063a6c3e6b91461005b578063e21f37ce1461008b575b600080fd5b6100596100543660046101a3565b6100a0565b005b60015461006e906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b6100936100c4565b6040516100829190610217565b60006100ad828483610304565b5050600180546001600160a01b0319163317905550565b6001546060906001600160a01b031633146101135760405162461bcd60e51b815260206004820152600b60248201526a1b9bdd08185b1b1bddd95960aa1b604482015260640160405180910390fd5b600080546101209061027b565b80601f016020809104026020016040519081016040528092919081815260200182805461014c9061027b565b80156101995780601f1061016e57610100808354040283529160200191610199565b820191906000526020600020905b81548152906001019060200180831161017c57829003601f168201915b5050505050905090565b600080602083850312156101b657600080fd5b823567ffffffffffffffff8111156101cd57600080fd5b8301601f810185136101de57600080fd5b803567ffffffffffffffff8111156101f557600080fd5b85602082840101111561020757600080fd5b6020919091019590945092505050565b602081526000825180602084015260005b818110156102455760208186018101516040868401015201610228565b506000604082850101526040601f19601f83011684010191505092915050565b634e487b7160e01b600052604160045260246000fd5b600181811c9082168061028f57607f821691505b6020821081036102af57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156102ff57806000526020600020601f840160051c810160208510156102dc5750805b601f840160051c820191505b818110156102fc57600081556001016102e8565b50505b505050565b67ffffffffffffffff83111561031c5761031c610265565b6103308361032a835461027b565b836102b5565b6000601f841160018114610364576000851561034c5750838201355b600019600387901b1c1916600186901b1783556102fc565b600083815260209020601f19861690835b828110156103955786850135825560209485019460019092019101610375565b50868210156103b25760001960f88860031b161c19848701351681555b505060018560011b018355505050505056fea2646970667358221220db046816c89637c515f1db2459b8878616b894e0d022cfe71f5c72db77539b3f64736f6c634300081e0033",
}

// MessageBoxABI is the input ABI used to generate the binding from.
// Deprecated: Use MessageBoxMetaData.ABI instead.
var MessageBoxABI = MessageBoxMetaData.ABI

// MessageBoxBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use MessageBoxMetaData.Bin instead.
var MessageBoxBin = MessageBoxMetaData.Bin

// DeployMessageBox deploys a new Ethereum contract, binding an instance of MessageBox to it.
func DeployMessageBox(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *MessageBox, error) {
	parsed, err := MessageBoxMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(MessageBoxBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &MessageBox{MessageBoxCaller: MessageBoxCaller{contract: contract}, MessageBoxTransactor: MessageBoxTransactor{contract: contract}, MessageBoxFilterer: MessageBoxFilterer{contract: contract}}, nil
}

// MessageBox is an auto generated Go binding around an Ethereum contract.
type MessageBox struct {
	MessageBoxCaller     // Read-only binding to the contract
	MessageBoxTransactor // Write-only binding to the contract
	MessageBoxFilterer   // Log filterer for contract events
}

// MessageBoxCaller is an auto generated read-only Go binding around an Ethereum contract.
type MessageBoxCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MessageBoxTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MessageBoxTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MessageBoxFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MessageBoxFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MessageBoxSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MessageBoxSession struct {
	Contract     *MessageBox       // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MessageBoxCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MessageBoxCallerSession struct {
	Contract *MessageBoxCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts     // Call options to use throughout this session
}

// MessageBoxTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MessageBoxTransactorSession struct {
	Contract     *MessageBoxTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// MessageBoxRaw is an auto generated low-level Go binding around an Ethereum contract.
type MessageBoxRaw struct {
	Contract *MessageBox // Generic contract binding to access the raw methods on
}

// MessageBoxCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MessageBoxCallerRaw struct {
	Contract *MessageBoxCaller // Generic read-only contract binding to access the raw methods on
}

// MessageBoxTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MessageBoxTransactorRaw struct {
	Contract *MessageBoxTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMessageBox creates a new instance of MessageBox, bound to a specific deployed contract.
func NewMessageBox(address common.Address, backend bind.ContractBackend) (*MessageBox, error) {
	contract, err := bindMessageBox(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &MessageBox{MessageBoxCaller: MessageBoxCaller{contract: contract}, MessageBoxTransactor: MessageBoxTransactor{contract: contract}, MessageBoxFilterer: MessageBoxFilterer{contract: contract}}, nil
}

// NewMessageBoxCaller creates a new read-only instance of MessageBox, bound to a specific deployed contract.
func NewMessageBoxCaller(address common.Address, caller bind.ContractCaller) (*MessageBoxCaller, error) {
	contract, err := bindMessageBox(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MessageBoxCaller{contract: contract}, nil
}

// NewMessageBoxTransactor creates a new write-only instance of MessageBox, bound to a specific deployed contract.
func NewMessageBoxTransactor(address common.Address, transactor bind.ContractTransactor) (*MessageBoxTransactor, error) {
	contract, err := bindMessageBox(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MessageBoxTransactor{contract: contract}, nil
}

// NewMessageBoxFilterer creates a new log filterer instance of MessageBox, bound to a specific deployed contract.
func NewMessageBoxFilterer(address common.Address, filterer bind.ContractFilterer) (*MessageBoxFilterer, error) {
	contract, err := bindMessageBox(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MessageBoxFilterer{contract: contract}, nil
}

// bindMessageBox binds a generic wrapper to an already deployed contract.
func bindMessageBox(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := MessageBoxMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MessageBox *MessageBoxRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MessageBox.Contract.MessageBoxCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MessageBox *MessageBoxRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MessageBox.Contract.MessageBoxTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MessageBox *MessageBoxRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MessageBox.Contract.MessageBoxTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MessageBox *MessageBoxCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MessageBox.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MessageBox *MessageBoxTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MessageBox.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MessageBox *MessageBoxTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MessageBox.Contract.contract.Transact(opts, method, params...)
}

// Author is a free data retrieval call binding the contract method 0xa6c3e6b9.
//
// Solidity: function author() view returns(address)
func (_MessageBox *MessageBoxCaller) Author(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "author")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Author is a free data retrieval call binding the contract method 0xa6c3e6b9.
//
// Solidity: function author() view returns(address)
func (_MessageBox *MessageBoxSession) Author() (common.Address, error) {
	return _MessageBox.Contract.Author(&_MessageBox.CallOpts)
}

// Author is a free data retrieval call binding the contract method 0xa6c3e6b9.
//
// Solidity: function author() view returns(address)
func (_MessageBox *MessageBoxCallerSession) Author() (common.Address, error) {
	return _MessageBox.Contract.Author(&_MessageBox.CallOpts)
}

// Message is a free data retrieval call binding the contract method 0xe21f37ce.
//
// Solidity: function message() view returns(string)
func (_MessageBox *MessageBoxCaller) Message(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "message")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Message is a free data retrieval call binding the contract method 0xe21f37ce.
//
// Solidity: function message() view returns(string)
func (_MessageBox *MessageBoxSession) Message() (string, error) {
	return _MessageBox.Contract.Message(&_MessageBox.CallOpts)
}

// Message is a free data retrieval call binding the contract method 0xe21f37ce.
//
// Solidity: function message() view returns(string)
func (_MessageBox *MessageBoxCallerSession) Message() (string, error) {
	return _MessageBox.Contract.Message(&_MessageBox.CallOpts)
}

// SetMessage is a paid mutator transaction binding the contract method 0x368b8772.
//
// Solidity: function setMessage(string in_message) returns()
func (_MessageBox *MessageBoxTransactor) SetMessage(opts *bind.TransactOpts, in_message string) (*types.Transaction, error) {
	return _MessageBox.contract.Transact(opts, "setMessage", in_message)
}

// SetMessage is a paid mutator transaction binding the contract method 0x368b8772.
//
// Solidity: function setMessage(string in_message) returns()
func (_MessageBox *MessageBoxSession) SetMessage(in_message string) (*types.Transaction, error) {
	return _MessageBox.Contract.SetMessage(&_MessageBox.TransactOpts, in_message)
}

// SetMessage is a paid mutator transaction binding the contract method 0x368b8772.
//
// Solidity: function setMessage(string in_message) returns()
func (_MessageBox *MessageBoxTransactorSession) SetMessage(in_message string) (*types.Transaction, error) {
	return _MessageBox.Contract.SetMessage(&_MessageBox.TransactOpts, in_message)
}
