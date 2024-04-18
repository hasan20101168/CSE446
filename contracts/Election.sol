// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract PatientManagement {
    struct Patient {
        string id;
        string name;
        uint age;
        string gender;
        string vaccineStatus;
        string district;
        string symptoms;
        bool isDead;
    }

    address public admin;
    mapping(string => Patient) public patients;
    mapping(string => uint) public districtPatientCounts;
    mapping(string => uint[]) public districtPatientAges;

    string[] public districts;
    uint public totalDeaths = 0;
    uint public totalPatients = 0;

    event PatientAdded(string patientId);
    event PatientUpdated(string patientId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addPatientData(
        string memory patientId,
        string memory name,
        uint age,
        string memory gender,
        string memory vaccineStatus,
        string memory district,
        string memory symptoms
    ) public {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");

        // Create a new patient and save it in the patients mapping
        patients[patientId] = Patient(
            patientId,
            name,
            age,
            gender,
            vaccineStatus,
            district,
            symptoms,
            false // Initial isDead value is false
        );

        // Increment patient count and add age to districtPatientAges mapping
        if (districtPatientCounts[district] == 0) {
            districts.push(district);
        }
        districtPatientCounts[district]++;
        districtPatientAges[district].push(age);
        totalPatients++;

        emit PatientAdded(patientId);
    }

    function updatePatientData(
        string memory patientId,
        string memory vaccineStatus,
        bool isDead
    ) public onlyAdmin {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("not_vaccinated")) ||
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("one_dose")) ||
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("two_dose")),
            "Invalid vaccine status"
        );

        Patient storage patient = patients[patientId];
        require(bytes(patient.id).length > 0, "Patient not found");

        // Update vaccine status and death status
        patient.vaccineStatus = vaccineStatus;
        if (patient.isDead != isDead) {
            if (isDead) {
                totalDeaths++;
                districtPatientCounts[patient.district]--;
            } else {
                totalDeaths--;
                districtPatientCounts[patient.district]++;
            }
            patient.isDead = isDead;
        }

        emit PatientUpdated(patientId);
    }

    function getAverageDeathRatePerDay() public view returns (uint) {
        // Calculate average death rate per day
        if (totalPatients == 0) {
            return 0;
        }
        return (totalDeaths * 100) / totalPatients;
    }

    function getDistrictWithHighestCovidPatients() public view returns (string memory) {
        // Determine the district with the highest number of patients
        uint maxCount = 0;
        string memory maxDistrict = "";

        for (uint i = 0; i < districts.length; i++) {
            string memory district = districts[i];
            uint count = districtPatientCounts[district];
            if (count > maxCount) {
                maxCount = count;
                maxDistrict = district;
            }
        }

        return maxDistrict;
    }

    function getMedianAgePerDistrict() public view returns (string[] memory districtsList, uint[] memory medians) {
        // Calculate the median age per district
        districtsList = new string[](districts.length);
        medians = new uint[](districts.length);

        for (uint i = 0; i < districts.length; i++) {
            string memory district = districts[i];
            uint[] memory ages = districtPatientAges[district];

            // Sort ages array
            uint[] memory sortedAges = ages;
            sort(sortedAges);

            uint medianAge;
            uint length = sortedAges.length;
            if (length % 2 == 0) {
                medianAge = (sortedAges[length / 2 - 1] + sortedAges[length / 2]) / 2;
            } else {
                medianAge = sortedAges[length / 2];
            }

            districtsList[i] = district;
            medians[i] = medianAge;
        }

        return (districtsList, medians);
    }

    function getPatientAgeGroupPercentages() public view returns (uint childrenPercentage, uint teenagersPercentage, uint youngPercentage, uint elderPercentage) {
        // Calculate age group percentages
        uint totalChildren = 0;
        uint totalTeenagers = 0;
        uint totalYoung = 0;
        uint totalElder = 0;

        for (uint i = 0; i < districts.length; i++) {
            string memory district = districts[i];
            uint[] memory ages = districtPatientAges[district];

            for (uint j = 0; j < ages.length; j++) {
                uint age = ages[j];
                if (age < 13) {
                    totalChildren++;
                } else if (age >= 13 && age < 20) {
                    totalTeenagers++;
                } else if (age >= 20 && age < 50) {
                    totalYoung++;
                } else {
                    totalElder++;
                }
            }
        }

        // Calculate percentages
        if (totalPatients == 0) {
            return (0, 0, 0, 0);
        }

        childrenPercentage = (totalChildren * 100) / totalPatients;
        teenagersPercentage = (totalTeenagers * 100) / totalPatients;
        youngPercentage = (totalYoung * 100) / totalPatients;
        elderPercentage = (totalElder * 100) / totalPatients;

        return (childrenPercentage, teenagersPercentage, youngPercentage, elderPercentage);
    }

    function getPatientVaccineStatus(string memory patientId) public view returns (string memory) {
        Patient storage patient = patients[patientId];
        require(bytes(patient.id).length > 0, "Patient not found");
        return patient.vaccineStatus;
    }

    function sort(uint[] memory data) internal pure {
        // Simple bubble sort
        for (uint i = 0; i < data.length; i++) {
            for (uint j = i + 1; j < data.length; j++) {
                if (data[i] > data[j]) {
                    uint temp = data[i];
                    data[i] = data[j];
                    data[j] = temp;
                }
            }
        }
    }
}

