pragma solidity ^0.5.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../contracts/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    FlightSuretyData flightSuretyData;      //Data contract

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    bool private operational = true; 
    address private contractOwner;                                  // Account used to deploy contract
    mapping(bytes32 => Flight) private flights;                     //
    uint256 public constant airlineFee = 10 ether;                  // Required fees to activate airlines registeration
    uint256 public constant insurenceFee = 1 ether;                 // Maximum insurance fee
    uint256 public constant consensusAirlinesNumber = 4;            // Number of airlines that can register before consensus requirement
    address[] private multiConsenses;                               // All voted airlines addresses 
    address payable dataContractAddress;                            // Data contract Address
    

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        string flightNumber;
    }

    //events
    event airlineRegistred(address airline);
    event airlineFunded(address airline);
    event insurancePurchased(address airline, string flightNumber, uint256 timestamp, address _address , uint256 value);
    event flightRegistered(string flightNumber);
    event PassengerPayout(address airline);

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
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier checkValue()
    {
        require(msg.value >= airlineFee, 'Invalid fund value'); 
        _;
        uint256 refund = (msg.value).sub(airlineFee);
        (msg.sender).transfer(refund);
    }

    modifier requireIsPassenger()
    {
        require(flightSuretyData.isPassenger(msg.sender), "Invalid passenger address");
        _;
    }
    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address payable _dataContractAddress) public 
    {
        contractOwner = msg.sender;
        dataContractAddress = _dataContractAddress;
        flightSuretyData = FlightSuretyData(dataContractAddress);
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

    function isDataContractOperational()  public view  returns(bool) 
    {
        return  flightSuretyData.isOperational();
    }

    function isFlight(bytes32 flight) public view returns(bool) 
    {
        return flights[flight].isRegistered;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline(address _newAirline) external requireIsOperational returns(bool success, uint256 votes)
    {
        uint256 numRegisteredAirlines = flightSuretyData.getNumberOfRegistredAirline();
        bool isDuplicated = false;
        votes = 0;
        if(numRegisteredAirlines <= consensusAirlinesNumber){
            require(flightSuretyData.isRegistered(msg.sender), "Airline is not registred");
            require(flightSuretyData.isFunded(msg.sender), "Airline is not funded");
            votes = multiConsenses.length;
            for(uint256 i=0 ; i < votes ; i++){
                if(multiConsenses[i] == msg.sender){
                    isDuplicated = true;
                    success = false;
                    return (success, votes);
                }
            }
            multiConsenses.push(msg.sender);
            votes = multiConsenses.length;
            if (votes >= (numRegisteredAirlines/2)){
                multiConsenses = new address[](0);
            }
        }

        if(!isDuplicated){
            flightSuretyData.registerAirline(_newAirline);
            success = true;
        }
        emit airlineRegistred(_newAirline);
        return (success, votes);
    }

    function getRegisteredAirlines() external view returns(address[] memory){
        return flightSuretyData.getRegisteredAirlines();
    }

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fundAirline() external payable requireIsOperational checkValue
    {
        require(flightSuretyData.isRegistered(msg.sender), "Airline is not registred");
        require(!flightSuretyData.isFunded(msg.sender), "Airline is already funded");
   
        dataContractAddress.transfer(airlineFee);
        flightSuretyData.fundAirline();
        emit airlineFunded(msg.sender);
    }

    function getFundedAirlines() external view returns(address[] memory)
    {
        return flightSuretyData.getFundedAirlines();
    }
    /**
    * @dev Register a new passenger.
    *
    */ 
    function registerPassenger(address _address) external 
    {
        flightSuretyData.registerPassenger( _address);
    }

    /**
    * @dev Passenger can buy an insurance.
    *
    */ 
    function buyInsurence(address _airline, string calldata _flightNumber, uint256 _timestamp) external payable requireIsOperational requireIsPassenger 
    {
        bytes32 flightKey = flightSuretyData.getFlightKey(_airline, _flightNumber, _timestamp);
        require (flights[flightKey].isRegistered, "Flight is not registered");
        require(msg.value <= insurenceFee, "Invaled incurence fee");
        require(msg.value > 0, "Invaled incurence fee");
        flightSuretyData.buy.value(msg.value)(flightKey);
        emit insurancePurchased(_airline, _flightNumber, _timestamp, msg.sender, msg.value);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight(address _airline, string calldata _flightNumber, uint256 _timestamp) external requireIsOperational
    {
        bytes32 flightKey = flightSuretyData.getFlightKey(_airline, _flightNumber, _timestamp);
        require (!flights[flightKey].isRegistered, "Flight is already registered");
        flights[flightKey] = Flight({isRegistered: true, statusCode:STATUS_CODE_UNKNOWN, updatedTimestamp:_timestamp, airline: _airline, flightNumber: _flightNumber});
        emit flightRegistered(_flightNumber);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(bytes32 flightKey, uint8 statusCode) internal requireIsOperational
    {
        require(oracleResponses[flightKey].isOpen, "Flight status request is closed");
        oracleResponses[flightKey].isOpen = false;
        flights[flightKey].statusCode = statusCode;
        if(statusCode == STATUS_CODE_LATE_AIRLINE)
        {
            flightSuretyData.creditInsurees(flightKey);
        }
        
    }

    function payout() public requireIsOperational
    {
        emit PassengerPayout(msg.sender);
        flightSuretyData.pay();
        
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(address airline, string calldata flight, uint256 timestamp) external requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);
        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({requester: msg.sender, isOpen: true});
        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
                            requireIsOperational
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
                                    
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            requireIsOperational
                            returns( uint8[3] memory) 
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
                        requireIsOperational
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            // Handle flight status as appropriate
            processFlightStatus(key, statusCode);
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

contract FlightSuretyData {
    function isOperational() public view returns(bool);
    function getNumberOfRegistredAirline() external view returns(uint256);
    function registerAirline(address _newAirline) external returns(bool);
    function getRegisteredAirlines() external view returns(address[] memory);
    function isRegistered(address airline) public view returns(bool);
    function fundAirline() external ;
    function getFundedAirlines() external view returns(address[] memory);
    function isFunded(address airline) public view returns(bool);
    function registerPassenger(address _address) external;
    function isPassenger(address _address) public view returns(bool);
    function buy(bytes32 flightKey) external payable;
    function getFlightKey(address airline, string calldata flight, uint256 timestamp) pure external returns(bytes32);
    function creditInsurees(bytes32 flightKey) external view;
    function pay() external payable;
}