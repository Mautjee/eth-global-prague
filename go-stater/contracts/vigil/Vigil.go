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

// VigilSecretMetadata is an auto generated low-level Go binding around an user-defined struct.
type VigilSecretMetadata struct {
	Creator   common.Address
	Name      string
	Longevity *big.Int
}

// MessageBoxMetaData contains all meta data concerning the MessageBox contract.
var MessageBoxMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"creator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"SecretCreated\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"_lastSeen\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"_metas\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"creator\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"longevity\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"longevity\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"secret\",\"type\":\"bytes\"}],\"name\":\"createSecret\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"}],\"name\":\"getLastSeen\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"offset\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"getMetas\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"creator\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"longevity\",\"type\":\"uint256\"}],\"internalType\":\"structVigil.SecretMetadata[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"refreshSecrets\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"revealSecret\",\"outputs\":[{\"internalType\":\"bytes\",\"name\":\"\",\"type\":\"bytes\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
	Bin: "0x6080604052348015600f57600080fd5b50610c9d8061001f6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c806388193a251161005b57806388193a25146100f757806397513690146100ff57806398df67c61461011f578063cafc24ff1461013f57600080fd5b8063413c0fd8146100825780634aec3a321461009757806361b94576146100c0575b600080fd5b6100956100903660046107de565b610161565b005b6100aa6100a536600461085d565b6102ce565b6040516100b791906108c5565b60405180910390f35b6100e96100ce366004610957565b6001600160a01b031660009081526002602052604090205490565b6040519081526020016100b7565b610095610502565b6100e961010d366004610957565b60026020526000908152604090205481565b61013261012d366004610987565b61051b565b6040516100b791906109a0565b61015261014d366004610987565b6106cd565b6040516100b7939291906109b3565b610178336000908152600260205260409020429055565b60006040518060600160405280336001600160a01b0316815260200187878080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920182905250938552505050602091820187905283546001808201865594825290829020835160039092020180546001600160a01b0319166001600160a01b0390921691909117815590820151919290919082019061021f9082610a86565b50604091909101516002909101556001805480820182556000919091527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf601610269828483610b45565b50848460405161027a929190610c05565b60405190819003902060005433907f12a499eb02c8cf9494d3a624d30d5f39809807866252f6783a9ad28431d52e95906102b690600190610c2b565b60405190815260200160405180910390a35050505050565b6000546060908310610338576040805160008082526020820190925290610330565b61031d604051806060016040528060006001600160a01b0316815260200160608152602001600081525090565b8152602001906001900390816102f05790505b5090506104fc565b600080546103468486610c3e565b111561035f5760005461035a908590610c2b565b610361565b825b905060008167ffffffffffffffff81111561037e5761037e6109e7565b6040519080825280602002602001820160405280156103dc57816020015b6103c9604051806060016040528060006001600160a01b0316815260200160608152602001600081525090565b81526020019060019003908161039c5790505b50905060005b828110156104f75760006103f68288610c3e565b8154811061040657610406610c51565b6000918252602091829020604080516060810190915260039092020180546001600160a01b031682526001810180549293919291840191610446906109fd565b80601f0160208091040260200160405190810160405280929190818152602001828054610472906109fd565b80156104bf5780601f10610494576101008083540402835291602001916104bf565b820191906000526020600020905b8154815290600101906020018083116104a257829003601f168201915b505050505081526020016002820154815250508282815181106104e4576104e4610c51565b60209081029190910101526001016103e2565b509150505b92915050565b610519336000908152600260205260409020429055565b565b60005460609082106105655760405162461bcd60e51b815260206004820152600e60248201526d1b9bc81cdd58da081cd958dc995d60921b60448201526064015b60405180910390fd5b600080838154811061057957610579610c51565b6000918252602082206003909102015481546001600160a01b0390911692508190859081106105aa576105aa610c51565b6000918252602080832060026003909302018201546001600160a01b03861684529190526040909120546105de9190610c3e565b90508042101561061e5760405162461bcd60e51b815260206004820152600b60248201526a1b9bdd08195e1c1a5c995960aa1b604482015260640161055c565b6001848154811061063157610631610c51565b906000526020600020018054610646906109fd565b80601f0160208091040260200160405190810160405280929190818152602001828054610672906109fd565b80156106bf5780601f10610694576101008083540402835291602001916106bf565b820191906000526020600020905b8154815290600101906020018083116106a257829003601f168201915b505050505092505050919050565b600081815481106106dd57600080fd5b6000918252602090912060039091020180546001820180546001600160a01b0390921693509061070c906109fd565b80601f0160208091040260200160405190810160405280929190818152602001828054610738906109fd565b80156107855780601f1061075a57610100808354040283529160200191610785565b820191906000526020600020905b81548152906001019060200180831161076857829003601f168201915b5050505050908060020154905083565b60008083601f8401126107a757600080fd5b50813567ffffffffffffffff8111156107bf57600080fd5b6020830191508360208285010111156107d757600080fd5b9250929050565b6000806000806000606086880312156107f657600080fd5b853567ffffffffffffffff81111561080d57600080fd5b61081988828901610795565b90965094505060208601359250604086013567ffffffffffffffff81111561084057600080fd5b61084c88828901610795565b969995985093965092949392505050565b6000806040838503121561087057600080fd5b50508035926020909101359150565b6000815180845260005b818110156108a557602081850181015186830182015201610889565b506000602082860101526020601f19601f83011685010191505092915050565b6000602082016020835280845180835260408501915060408160051b86010192506020860160005b8281101561094b57868503603f19018452815180516001600160a01b031686526020808201516060918801829052906109289088018261087f565b6040928301519790920196909652945060209384019391909101906001016108ed565b50929695505050505050565b60006020828403121561096957600080fd5b81356001600160a01b038116811461098057600080fd5b9392505050565b60006020828403121561099957600080fd5b5035919050565b602081526000610980602083018461087f565b6001600160a01b03841681526060602082018190526000906109d79083018561087f565b9050826040830152949350505050565b634e487b7160e01b600052604160045260246000fd5b600181811c90821680610a1157607f821691505b602082108103610a3157634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115610a8157806000526020600020601f840160051c81016020851015610a5e5750805b601f840160051c820191505b81811015610a7e5760008155600101610a6a565b50505b505050565b815167ffffffffffffffff811115610aa057610aa06109e7565b610ab481610aae84546109fd565b84610a37565b6020601f821160018114610ae85760008315610ad05750848201515b600019600385901b1c1916600184901b178455610a7e565b600084815260208120601f198516915b82811015610b185787850151825560209485019460019092019101610af8565b5084821015610b365786840151600019600387901b60f8161c191681555b50505050600190811b01905550565b67ffffffffffffffff831115610b5d57610b5d6109e7565b610b7183610b6b83546109fd565b83610a37565b6000601f841160018114610ba55760008515610b8d5750838201355b600019600387901b1c1916600186901b178355610a7e565b600083815260209020601f19861690835b82811015610bd65786850135825560209485019460019092019101610bb6565b5086821015610bf35760001960f88860031b161c19848701351681555b505060018560011b0183555050505050565b8183823760009101908152919050565b634e487b7160e01b600052601160045260246000fd5b818103818111156104fc576104fc610c15565b808201808211156104fc576104fc610c15565b634e487b7160e01b600052603260045260246000fdfea26469706673582212207f81532370f41c837a895c194a7d1d9ffe16cd3d584da9936b2ce75a9337c17564736f6c634300081e0033",
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

// LastSeen is a free data retrieval call binding the contract method 0x97513690.
//
// Solidity: function _lastSeen(address ) view returns(uint256)
func (_MessageBox *MessageBoxCaller) LastSeen(opts *bind.CallOpts, arg0 common.Address) (*big.Int, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "_lastSeen", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// LastSeen is a free data retrieval call binding the contract method 0x97513690.
//
// Solidity: function _lastSeen(address ) view returns(uint256)
func (_MessageBox *MessageBoxSession) LastSeen(arg0 common.Address) (*big.Int, error) {
	return _MessageBox.Contract.LastSeen(&_MessageBox.CallOpts, arg0)
}

// LastSeen is a free data retrieval call binding the contract method 0x97513690.
//
// Solidity: function _lastSeen(address ) view returns(uint256)
func (_MessageBox *MessageBoxCallerSession) LastSeen(arg0 common.Address) (*big.Int, error) {
	return _MessageBox.Contract.LastSeen(&_MessageBox.CallOpts, arg0)
}

// Metas is a free data retrieval call binding the contract method 0xcafc24ff.
//
// Solidity: function _metas(uint256 ) view returns(address creator, string name, uint256 longevity)
func (_MessageBox *MessageBoxCaller) Metas(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Creator   common.Address
	Name      string
	Longevity *big.Int
}, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "_metas", arg0)

	outstruct := new(struct {
		Creator   common.Address
		Name      string
		Longevity *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Creator = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Name = *abi.ConvertType(out[1], new(string)).(*string)
	outstruct.Longevity = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// Metas is a free data retrieval call binding the contract method 0xcafc24ff.
//
// Solidity: function _metas(uint256 ) view returns(address creator, string name, uint256 longevity)
func (_MessageBox *MessageBoxSession) Metas(arg0 *big.Int) (struct {
	Creator   common.Address
	Name      string
	Longevity *big.Int
}, error) {
	return _MessageBox.Contract.Metas(&_MessageBox.CallOpts, arg0)
}

// Metas is a free data retrieval call binding the contract method 0xcafc24ff.
//
// Solidity: function _metas(uint256 ) view returns(address creator, string name, uint256 longevity)
func (_MessageBox *MessageBoxCallerSession) Metas(arg0 *big.Int) (struct {
	Creator   common.Address
	Name      string
	Longevity *big.Int
}, error) {
	return _MessageBox.Contract.Metas(&_MessageBox.CallOpts, arg0)
}

// GetLastSeen is a free data retrieval call binding the contract method 0x61b94576.
//
// Solidity: function getLastSeen(address owner) view returns(uint256)
func (_MessageBox *MessageBoxCaller) GetLastSeen(opts *bind.CallOpts, owner common.Address) (*big.Int, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "getLastSeen", owner)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetLastSeen is a free data retrieval call binding the contract method 0x61b94576.
//
// Solidity: function getLastSeen(address owner) view returns(uint256)
func (_MessageBox *MessageBoxSession) GetLastSeen(owner common.Address) (*big.Int, error) {
	return _MessageBox.Contract.GetLastSeen(&_MessageBox.CallOpts, owner)
}

// GetLastSeen is a free data retrieval call binding the contract method 0x61b94576.
//
// Solidity: function getLastSeen(address owner) view returns(uint256)
func (_MessageBox *MessageBoxCallerSession) GetLastSeen(owner common.Address) (*big.Int, error) {
	return _MessageBox.Contract.GetLastSeen(&_MessageBox.CallOpts, owner)
}

// GetMetas is a free data retrieval call binding the contract method 0x4aec3a32.
//
// Solidity: function getMetas(uint256 offset, uint256 count) view returns((address,string,uint256)[])
func (_MessageBox *MessageBoxCaller) GetMetas(opts *bind.CallOpts, offset *big.Int, count *big.Int) ([]VigilSecretMetadata, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "getMetas", offset, count)

	if err != nil {
		return *new([]VigilSecretMetadata), err
	}

	out0 := *abi.ConvertType(out[0], new([]VigilSecretMetadata)).(*[]VigilSecretMetadata)

	return out0, err

}

// GetMetas is a free data retrieval call binding the contract method 0x4aec3a32.
//
// Solidity: function getMetas(uint256 offset, uint256 count) view returns((address,string,uint256)[])
func (_MessageBox *MessageBoxSession) GetMetas(offset *big.Int, count *big.Int) ([]VigilSecretMetadata, error) {
	return _MessageBox.Contract.GetMetas(&_MessageBox.CallOpts, offset, count)
}

// GetMetas is a free data retrieval call binding the contract method 0x4aec3a32.
//
// Solidity: function getMetas(uint256 offset, uint256 count) view returns((address,string,uint256)[])
func (_MessageBox *MessageBoxCallerSession) GetMetas(offset *big.Int, count *big.Int) ([]VigilSecretMetadata, error) {
	return _MessageBox.Contract.GetMetas(&_MessageBox.CallOpts, offset, count)
}

// RevealSecret is a free data retrieval call binding the contract method 0x98df67c6.
//
// Solidity: function revealSecret(uint256 index) view returns(bytes)
func (_MessageBox *MessageBoxCaller) RevealSecret(opts *bind.CallOpts, index *big.Int) ([]byte, error) {
	var out []interface{}
	err := _MessageBox.contract.Call(opts, &out, "revealSecret", index)

	if err != nil {
		return *new([]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([]byte)).(*[]byte)

	return out0, err

}

// RevealSecret is a free data retrieval call binding the contract method 0x98df67c6.
//
// Solidity: function revealSecret(uint256 index) view returns(bytes)
func (_MessageBox *MessageBoxSession) RevealSecret(index *big.Int) ([]byte, error) {
	return _MessageBox.Contract.RevealSecret(&_MessageBox.CallOpts, index)
}

// RevealSecret is a free data retrieval call binding the contract method 0x98df67c6.
//
// Solidity: function revealSecret(uint256 index) view returns(bytes)
func (_MessageBox *MessageBoxCallerSession) RevealSecret(index *big.Int) ([]byte, error) {
	return _MessageBox.Contract.RevealSecret(&_MessageBox.CallOpts, index)
}

// CreateSecret is a paid mutator transaction binding the contract method 0x413c0fd8.
//
// Solidity: function createSecret(string name, uint256 longevity, bytes secret) returns()
func (_MessageBox *MessageBoxTransactor) CreateSecret(opts *bind.TransactOpts, name string, longevity *big.Int, secret []byte) (*types.Transaction, error) {
	return _MessageBox.contract.Transact(opts, "createSecret", name, longevity, secret)
}

// CreateSecret is a paid mutator transaction binding the contract method 0x413c0fd8.
//
// Solidity: function createSecret(string name, uint256 longevity, bytes secret) returns()
func (_MessageBox *MessageBoxSession) CreateSecret(name string, longevity *big.Int, secret []byte) (*types.Transaction, error) {
	return _MessageBox.Contract.CreateSecret(&_MessageBox.TransactOpts, name, longevity, secret)
}

// CreateSecret is a paid mutator transaction binding the contract method 0x413c0fd8.
//
// Solidity: function createSecret(string name, uint256 longevity, bytes secret) returns()
func (_MessageBox *MessageBoxTransactorSession) CreateSecret(name string, longevity *big.Int, secret []byte) (*types.Transaction, error) {
	return _MessageBox.Contract.CreateSecret(&_MessageBox.TransactOpts, name, longevity, secret)
}

// RefreshSecrets is a paid mutator transaction binding the contract method 0x88193a25.
//
// Solidity: function refreshSecrets() returns()
func (_MessageBox *MessageBoxTransactor) RefreshSecrets(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MessageBox.contract.Transact(opts, "refreshSecrets")
}

// RefreshSecrets is a paid mutator transaction binding the contract method 0x88193a25.
//
// Solidity: function refreshSecrets() returns()
func (_MessageBox *MessageBoxSession) RefreshSecrets() (*types.Transaction, error) {
	return _MessageBox.Contract.RefreshSecrets(&_MessageBox.TransactOpts)
}

// RefreshSecrets is a paid mutator transaction binding the contract method 0x88193a25.
//
// Solidity: function refreshSecrets() returns()
func (_MessageBox *MessageBoxTransactorSession) RefreshSecrets() (*types.Transaction, error) {
	return _MessageBox.Contract.RefreshSecrets(&_MessageBox.TransactOpts)
}

// MessageBoxSecretCreatedIterator is returned from FilterSecretCreated and is used to iterate over the raw logs and unpacked data for SecretCreated events raised by the MessageBox contract.
type MessageBoxSecretCreatedIterator struct {
	Event *MessageBoxSecretCreated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MessageBoxSecretCreatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MessageBoxSecretCreated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MessageBoxSecretCreated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MessageBoxSecretCreatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MessageBoxSecretCreatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MessageBoxSecretCreated represents a SecretCreated event raised by the MessageBox contract.
type MessageBoxSecretCreated struct {
	Creator common.Address
	Name    common.Hash
	Index   *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterSecretCreated is a free log retrieval operation binding the contract event 0x12a499eb02c8cf9494d3a624d30d5f39809807866252f6783a9ad28431d52e95.
//
// Solidity: event SecretCreated(address indexed creator, string indexed name, uint256 index)
func (_MessageBox *MessageBoxFilterer) FilterSecretCreated(opts *bind.FilterOpts, creator []common.Address, name []string) (*MessageBoxSecretCreatedIterator, error) {

	var creatorRule []interface{}
	for _, creatorItem := range creator {
		creatorRule = append(creatorRule, creatorItem)
	}
	var nameRule []interface{}
	for _, nameItem := range name {
		nameRule = append(nameRule, nameItem)
	}

	logs, sub, err := _MessageBox.contract.FilterLogs(opts, "SecretCreated", creatorRule, nameRule)
	if err != nil {
		return nil, err
	}
	return &MessageBoxSecretCreatedIterator{contract: _MessageBox.contract, event: "SecretCreated", logs: logs, sub: sub}, nil
}

// WatchSecretCreated is a free log subscription operation binding the contract event 0x12a499eb02c8cf9494d3a624d30d5f39809807866252f6783a9ad28431d52e95.
//
// Solidity: event SecretCreated(address indexed creator, string indexed name, uint256 index)
func (_MessageBox *MessageBoxFilterer) WatchSecretCreated(opts *bind.WatchOpts, sink chan<- *MessageBoxSecretCreated, creator []common.Address, name []string) (event.Subscription, error) {

	var creatorRule []interface{}
	for _, creatorItem := range creator {
		creatorRule = append(creatorRule, creatorItem)
	}
	var nameRule []interface{}
	for _, nameItem := range name {
		nameRule = append(nameRule, nameItem)
	}

	logs, sub, err := _MessageBox.contract.WatchLogs(opts, "SecretCreated", creatorRule, nameRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MessageBoxSecretCreated)
				if err := _MessageBox.contract.UnpackLog(event, "SecretCreated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseSecretCreated is a log parse operation binding the contract event 0x12a499eb02c8cf9494d3a624d30d5f39809807866252f6783a9ad28431d52e95.
//
// Solidity: event SecretCreated(address indexed creator, string indexed name, uint256 index)
func (_MessageBox *MessageBoxFilterer) ParseSecretCreated(log types.Log) (*MessageBoxSecretCreated, error) {
	event := new(MessageBoxSecretCreated)
	if err := _MessageBox.contract.UnpackLog(event, "SecretCreated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
