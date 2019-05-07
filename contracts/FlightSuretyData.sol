pragma solidity ^0.5.0;

import "../contracts/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;               // Address of the allowed contracts to deal with the contract
    mapping (address => Airline) private airlines;                      // info of all registered airlines
    address[] private activeAirlines;                                   // All funded airlines addresses
    address[] private registeredAirlines;                               // All registered airlines addresses
    mapping (address => Passenger) private insuredPassengers;           // Passengers info
    address[] private passengers;                                       // All passengres addresses
    mapping (bytes32 => address[]) private boughtIncurence;
    mapping (address =>bytes32[]) allFlights;
    mapping (address => mapping(bytes32 => uint256)) insuredFlight;
    
    //Airline Struct
    struct Airline {
        address airlineAddress;
        bool isRegistered;
        bool isFunded;
    }

    //Passenger Struct
    struct Passenger{
        address passengerAddress;
        uint256 credit;
        bool isRegistered;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistred(address newAirline);
    event AirlineFunded(address _address);
    event PassengerRegidtered(address _address);
    event PassengerInsured(address _address, bytes32 flightKey);
    event PassengerCreditUpdated(address[] _addresses, bytes32 flightKey);
    event PassengerPayout(address _address, uint256 amount);
    event x(bytes32[] _x);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline) public 
    {
        contractOwner = msg.sender;
        registeredAirlines.push(firstAirline);
        airlines[firstAirline] = Airline({isRegistered: true, isFunded: false, airlineAddress: firstAirline});
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the "Caller" account is authorized
    */
    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == true, "Caller is not authorized");
        _;
    } 

    /**
    * @dev Modifier that requires the "Airline" is registred
    */
    modifier requireIsAirlineRegistred(address _airline)
    {
        require(airlines[_airline].isRegistered, "Airline is not registred");
        _;
    }

    /**
    * @dev Modifier that requires the "Airline" is funded
    */
    modifier requireIsAirlineFunded(address _airline)
    {
        require(airlines[_airline].isFunded, "Airline is not funded");
        _;
    }

    /**
    * @dev Modifier that requires the "passenger" has a flight insurance
    */
    modifier requirePassenger(address _passenger) {
        require(insuredPassengers[_passenger].isRegistered, "Invalid passenger address");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) 
    {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode) external requireContractOwner 
    {
        operational = mode;
    }

    /**
    * @dev authorize caller (contract address)
    */   
    function authorizeCaller(address contractAddress) external requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    /**
    * @dev unauthorize caller 
    */ 
    function deauthorizeCaller(address contractAddress) external requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /**
    * @dev Get authorize caller state
    * @return A bool that is the current caller status
    */ 
    function isCallerAuthorized(address contractAddress) public view requireContractOwner
    returns (bool)
    {
        return authorizedContracts[contractAddress];
    }

    /**
    * @dev check the registration of the airline
    *
    * @return A bool that is the state of airline registration
    */      
    function isRegistered(address airline) public view returns(bool) 
    {
        return airlines[airline].isRegistered;
    }

    /**
    * @dev check if airline is funded
    *
    * @return A bool that is the state of airline
    */      
    function isFunded(address airline) public view returns(bool) 
    {
        return airlines[airline].isFunded;
    }

    /**
    * @dev check pasenger registration
    *
    * @return  bool value
    */      
    function isPassenger(address _address) public view returns(bool) 
    {
        return insuredPassengers[_address].isRegistered;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address _newAirline) external 
    requireIsOperational 
    requireIsCallerAuthorized 
    requireIsAirlineRegistred(tx.origin)
    requireIsAirlineFunded(tx.origin)
    returns(bool)
    {
        require(_newAirline != address(0), 'Invalid airline address');
        require(!airlines[_newAirline].isRegistered, "Airline is already registered.");
        airlines[_newAirline] = Airline({isRegistered: true, isFunded: false, airlineAddress: _newAirline});
        registeredAirlines.push(_newAirline);
        return airlines[_newAirline].isRegistered;
        //emit AirlineRegistred(_newAirline);
    }

    /**
    * @dev Get registred airlines
    * @return list of adresses 
    */ 
    function getRegisteredAirlines() external view returns(address[] memory) 
    {
        return registeredAirlines;
    }

    /**
    * @dev Get number of the registred airlines
    * @return uint  
    */ 
    function getNumberOfRegistredAirline() external view returns(uint256) 
    {
        return registeredAirlines.length;
    }
  
     /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fundAirline() external
        requireIsOperational
        requireIsCallerAuthorized
        requireIsAirlineRegistred(tx.origin)
    {
        airlines[tx.origin].isFunded = true;
        activeAirlines.push(tx.origin);
        emit AirlineFunded(tx.origin);
    }

     /**
    * @dev Get funded airlines
    * @return list of adresses 
    */ 
    function getFundedAirlines() external view returns(address[] memory) 
    {
        return activeAirlines;
    }


    /**
    * @dev register passenger
    */
    function registerPassenger(address _address) public   
    {
        insuredPassengers[_address] = Passenger({passengerAddress: _address , credit: 0, isRegistered: true});
        passengers.push(_address);
        emit PassengerRegidtered(_address);
    }

    /**
    * @dev Get passenges addresses
    * @return list of adresses 
    */ 
    function getPassengers() external view returns(address[] memory) 
    {
        return passengers;
    }

    /**
    * @dev Get the flight key
    *
    */ 
    function getFlightKey(address airline, string calldata flight, uint256 timestamp) pure external returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(bytes32 flightKey, uint256 amount) external payable requireIsOperational requireIsCallerAuthorized requirePassenger(tx.origin)
    {
        //emit x(allFlights[tx.origin]);
        require(allFlights[tx.origin].length >= 0 , "passenger has already an incurence for this flight");
        boughtIncurence[flightKey].push(tx.origin);
        insuredFlight[tx.origin][flightKey] = amount;
        emit PassengerInsured(tx.origin, flightKey);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightKey) external payable requireIsOperational requireIsCallerAuthorized
    {
        require(boughtIncurence[flightKey].length >= 0 , "The flight does not have insurance recorded");
        for(uint i = 0; i < boughtIncurence[flightKey].length; i++) 
        {
            address _passengerAddress = boughtIncurence[flightKey][i];
            uint256 insurenceAmount = insuredFlight[tx.origin][flightKey];
            insuredPassengers[_passengerAddress].credit.add(insurenceAmount.div(10).mul(15));
        }
        emit PassengerCreditUpdated(boughtIncurence[flightKey], flightKey);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external payable requireIsOperational requireIsCallerAuthorized requirePassenger(tx.origin)
    {
        require(insuredPassengers[tx.origin].credit > 0, "There is no payout");
        uint amount  = insuredPassengers[tx.origin].credit;
        insuredPassengers[tx.origin].credit = 0;
        (tx.origin).transfer(amount);
        emit PassengerPayout(tx.origin, amount);
    } 

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() public payable
    {
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()  external  payable 
    {
        fund();
    }

}