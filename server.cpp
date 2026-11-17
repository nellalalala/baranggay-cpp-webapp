#ifdef _WIN32
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#endif

#include "httplib.h"
#include <iostream>
#include <string>

using namespace httplib;
using namespace std;

struct Complaint {
    string id;
    string complainant;
    string category;
    string location;
    string description;
    string status;
    string remarks;
    string date;
};

const int MAX_RECORDS = 100;
Complaint records[MAX_RECORDS];
int totalRecords = 0;

void seedData() {
    totalRecords = 0;
    records[totalRecords++] = {"CMP-1001", "Maria Santos", "Noise Complaint", "Blk 4 Lot 2", "Loud karaoke past midnight", "Pending", "None", "2026-11-15"};
    records[totalRecords++] = {"CMP-1002", "Juan Dela Cruz", "Garbage Collection", "Blk 1 Lot 5", "Uncollected trash for 3 days", "In Progress", "Coordinate with truck driver", "2026-11-16"};
}

string escapeJson(const string& s) {
    string result = "";
    for (char c : s) {
        if (c == '"') result += "\\\"";
        else if (c == '\\') result += "\\\\";
        else result += c;
    }
    return result;
}

int main() {
    cout << "Initializing database..." << endl;
    seedData();

    Server svr;
    svr.set_mount_point("/", "./");

    svr.Get("/api/complaints", [](const Request& req, Response& res) {
        string json = "[";
        for (int i = 0; i < totalRecords; i++) {
            json += "{";
            json += "\"id\":\"" + escapeJson(records[i].id) + "\",";
            json += "\"complainant\":\"" + escapeJson(records[i].complainant) + "\",";
            json += "\"category\":\"" + escapeJson(records[i].category) + "\",";
            json += "\"location\":\"" + escapeJson(records[i].location) + "\",";
            json += "\"description\":\"" + escapeJson(records[i].description) + "\",";
            json += "\"status\":\"" + escapeJson(records[i].status) + "\",";
            json += "\"remarks\":\"" + escapeJson(records[i].remarks) + "\",";
            json += "\"date\":\"" + records[i].date + "\"";
            json += "}";
            if (i < totalRecords - 1) json += ",";
        }
        json += "]";
        res.set_content(json, "application/json");
    });

    cout << "Starting Barangay C++ Server at http://localhost:8081 ..." << endl;
    
    if (!svr.listen("127.0.0.1", 8081)) {
        cout << "ERROR: Failed to bind to port 8081!" << endl;
    }

    return 0;
}