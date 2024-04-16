// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;


contract PatientRegistry {
    struct Patient {
        uint256 id;
        string name;
        uint256 age;
        string gender;
        bool vaccineStatus;
        string district;
        string symptomsDetails;
        bool isDead;
        uint256 dateAdded; // Date the patient was added (for computing average death rate per day)
    }

    mapping(uint256 => Patient) public patients;
    uint256 public patientCount;
    mapping(string => uint256) public districtPatientCount; // Mapping for patient count in each district
    mapping(string => uint256) public districtAgeSum; // Mapping for age sum in each district
    mapping(string => uint256) public districtDeathCount; // Mapping for death count in each district

    event PatientAdded(
        uint256 indexed id,
        string name,
        uint256 age,
        string gender,
        bool vaccineStatus,
        string district,
        string symptomsDetails,
        bool isDead
    );

    constructor() {
        patientCount = 0;
    }

    function addPatient(
        string memory _name,
        uint256 _age,
        string memory _gender,
        bool _vaccineStatus,
        string memory _district,
        string memory _symptomsDetails,
        bool _isDead,
        uint256 _dateAdded
    ) public {
        patientCount++;
        patients[patientCount] = Patient(
            patientCount,
            _name,
            _age,
            _gender,
            _vaccineStatus,
            _district,
            _symptomsDetails,
            _isDead,
            _dateAdded
        );
        
        // Update district data
        districtPatientCount[_district]++;
        districtAgeSum[_district] += _age;
        if (_isDead) {
            districtDeathCount[_district]++;
        }

        emit PatientAdded(
            patientCount,
            _name,
            _age,
            _gender,
            _vaccineStatus,
            _district,
            _symptomsDetails,
            _isDead
        );
    }

    function getPatient(uint256 _id) public view returns (Patient memory) {
        require(_id > 0 && _id <= patientCount, "Invalid patient ID.");
        return patients[_id];
    }
}
