define(["require", "exports"], function(require, exports) { 
    
    exports.metadata = "{\r\n  \"schema\": {\r\n    \"namespace\": \"Jigsaw.Data.Task\",\r\n    \"alias\": \"Self\",\r\n    \"annotation:UseStrongSpatialTypes\": \"false\",\r\n    \"xmlns:annotation\": \"http://schemas.microsoft.com/ado/2009/02/edm/annotation\",\r\n    \"xmlns\": \"http://schemas.microsoft.com/ado/2009/11/edm\",\r\n    \"cSpaceOSpaceMapping\": \"[[\\\"Jigsaw.Data.Task.TaskVersionTracker\\\",\\\"Jigsaw.Data.Task.TaskVersionTracker\\\"],[\\\"Jigsaw.Data.Task.TaskVersion\\\",\\\"Jigsaw.Data.Task.TaskVersion\\\"],[\\\"Jigsaw.Data.Task.Approval\\\",\\\"Jigsaw.Server.VersionPager.Approval\\\"],[\\\"Jigsaw.Data.Task.Task\\\",\\\"Jigsaw.Data.Task.Task\\\"],[\\\"Jigsaw.Data.Task.TaskTag\\\",\\\"Jigsaw.Data.Task.TaskTag\\\"],[\\\"Jigsaw.Data.Task.Tag\\\",\\\"Jigsaw.Data.Task.Tag\\\"]]\",\r\n    \"entityType\": [\r\n      {\r\n        \"name\": \"TaskVersionTracker\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"Guid\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"Guid\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"VersionTrackerCurrent\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          }\r\n        ],\r\n        \"navigationProperty\": [\r\n          {\r\n            \"name\": \"Current\",\r\n            \"relationship\": \"Self.TaskVersionTracker_Current\",\r\n            \"fromRole\": \"TaskVersionTracker_Current_Source\",\r\n            \"toRole\": \"TaskVersionTracker_Current_Target\"\r\n          },\r\n          {\r\n            \"name\": \"Historical\",\r\n            \"relationship\": \"Self.TaskVersionTracker_Historical\",\r\n            \"fromRole\": \"TaskVersionTracker_Historical_Source\",\r\n            \"toRole\": \"TaskVersionTracker_Historical_Target\"\r\n          },\r\n          {\r\n            \"name\": \"Pending\",\r\n            \"relationship\": \"Self.TaskVersionTracker_Pending\",\r\n            \"fromRole\": \"TaskVersionTracker_Pending_Source\",\r\n            \"toRole\": \"TaskVersionTracker_Pending_Target\"\r\n          }\r\n        ]\r\n      },\r\n      {\r\n        \"name\": \"TaskVersion\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"Guid\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"Guid\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"VersionEntity\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"ModifiedBy\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\"\r\n          },\r\n          {\r\n            \"name\": \"ModifiedDate\",\r\n            \"type\": \"Edm.DateTime\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"VersionTrackerPending\",\r\n            \"type\": \"Edm.Guid\"\r\n          },\r\n          {\r\n            \"name\": \"VersionTrackerHistorical\",\r\n            \"type\": \"Edm.Guid\"\r\n          },\r\n          {\r\n            \"name\": \"Audit\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\"\r\n          }\r\n        ],\r\n        \"navigationProperty\": [\r\n          {\r\n            \"name\": \"Approval\",\r\n            \"relationship\": \"Self.TaskVersion_Approval\",\r\n            \"fromRole\": \"TaskVersion_Approval_Source\",\r\n            \"toRole\": \"TaskVersion_Approval_Target\"\r\n          },\r\n          {\r\n            \"name\": \"Entity\",\r\n            \"relationship\": \"Self.TaskVersion_Entity\",\r\n            \"fromRole\": \"TaskVersion_Entity_Source\",\r\n            \"toRole\": \"TaskVersion_Entity_Target\"\r\n          }\r\n        ]\r\n      },\r\n      {\r\n        \"name\": \"Approval\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"Guid\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"Guid\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"ApprovedBy\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\"\r\n          },\r\n          {\r\n            \"name\": \"ApprovedDate\",\r\n            \"type\": \"Edm.DateTime\"\r\n          },\r\n          {\r\n            \"name\": \"Version\",\r\n            \"type\": \"Edm.Guid\"\r\n          },\r\n          {\r\n            \"name\": \"Step\",\r\n            \"type\": \"Edm.Int32\"\r\n          }\r\n        ]\r\n      },\r\n      {\r\n        \"name\": \"Task\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"Guid\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"Guid\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"Name\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\"\r\n          },\r\n          {\r\n            \"name\": \"Description\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\",\r\n            \"custom\": {\r\n              \"displayName\": \"Description!\",\r\n              \"description\": null\r\n            }\r\n          },\r\n          {\r\n            \"name\": \"BeginDate\",\r\n            \"type\": \"Edm.DateTime\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"EndDate\",\r\n            \"type\": \"Edm.DateTime\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"IsPerformed\",\r\n            \"type\": \"Edm.Boolean\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"IsSuspended\",\r\n            \"type\": \"Edm.Boolean\",\r\n            \"nullable\": \"false\"\r\n          }\r\n        ],\r\n        \"navigationProperty\": {\r\n          \"name\": \"TaskTags\",\r\n          \"relationship\": \"Self.Task_TaskTags\",\r\n          \"fromRole\": \"Task_TaskTags_Source\",\r\n          \"toRole\": \"Task_TaskTags_Target\"\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskTag\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"TaskTagID\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"TaskTagID\",\r\n            \"type\": \"Edm.Int32\",\r\n            \"nullable\": \"false\",\r\n            \"annotation:StoreGeneratedPattern\": \"Identity\"\r\n          },\r\n          {\r\n            \"name\": \"TaskGuid\",\r\n            \"type\": \"Edm.Guid\",\r\n            \"nullable\": \"false\"\r\n          },\r\n          {\r\n            \"name\": \"TagID\",\r\n            \"type\": \"Edm.Int32\",\r\n            \"nullable\": \"false\"\r\n          }\r\n        ],\r\n        \"navigationProperty\": {\r\n          \"name\": \"Tag\",\r\n          \"relationship\": \"Self.TaskTag_Tag\",\r\n          \"fromRole\": \"TaskTag_Tag_Source\",\r\n          \"toRole\": \"TaskTag_Tag_Target\"\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"Tag\",\r\n        \"key\": {\r\n          \"propertyRef\": {\r\n            \"name\": \"ID\"\r\n          }\r\n        },\r\n        \"property\": [\r\n          {\r\n            \"name\": \"ID\",\r\n            \"type\": \"Edm.Int32\",\r\n            \"nullable\": \"false\",\r\n            \"annotation:StoreGeneratedPattern\": \"Identity\"\r\n          },\r\n          {\r\n            \"name\": \"Name\",\r\n            \"type\": \"Edm.String\",\r\n            \"maxLength\": \"Max\",\r\n            \"fixedLength\": \"false\",\r\n            \"unicode\": \"true\"\r\n          }\r\n        ]\r\n      }\r\n    ],\r\n    \"association\": [\r\n      {\r\n        \"name\": \"TaskVersion_Approval\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskVersion_Approval_Source\",\r\n            \"type\": \"Edm.Self.TaskVersion\",\r\n            \"multiplicity\": \"0..1\"\r\n          },\r\n          {\r\n            \"role\": \"TaskVersion_Approval_Target\",\r\n            \"type\": \"Edm.Self.Approval\",\r\n            \"multiplicity\": \"*\"\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskVersion_Approval_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskVersion_Approval_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Version\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskTag_Tag\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskTag_Tag_Source\",\r\n            \"type\": \"Edm.Self.TaskTag\",\r\n            \"multiplicity\": \"*\"\r\n          },\r\n          {\r\n            \"role\": \"TaskTag_Tag_Target\",\r\n            \"type\": \"Edm.Self.Tag\",\r\n            \"multiplicity\": \"1\",\r\n            \"onDelete\": {\r\n              \"action\": \"Cascade\"\r\n            }\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskTag_Tag_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"ID\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskTag_Tag_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"TagID\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"Task_TaskTags\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"Task_TaskTags_Source\",\r\n            \"type\": \"Edm.Self.Task\",\r\n            \"multiplicity\": \"1\",\r\n            \"onDelete\": {\r\n              \"action\": \"Cascade\"\r\n            }\r\n          },\r\n          {\r\n            \"role\": \"Task_TaskTags_Target\",\r\n            \"type\": \"Edm.Self.TaskTag\",\r\n            \"multiplicity\": \"*\"\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"Task_TaskTags_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"Task_TaskTags_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"TaskGuid\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskVersion_Entity\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskVersion_Entity_Source\",\r\n            \"type\": \"Edm.Self.TaskVersion\",\r\n            \"multiplicity\": \"*\"\r\n          },\r\n          {\r\n            \"role\": \"TaskVersion_Entity_Target\",\r\n            \"type\": \"Edm.Self.Task\",\r\n            \"multiplicity\": \"1\",\r\n            \"onDelete\": {\r\n              \"action\": \"Cascade\"\r\n            }\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskVersion_Entity_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskVersion_Entity_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"VersionEntity\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskVersionTracker_Current\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskVersionTracker_Current_Source\",\r\n            \"type\": \"Edm.Self.TaskVersionTracker\",\r\n            \"multiplicity\": \"*\"\r\n          },\r\n          {\r\n            \"role\": \"TaskVersionTracker_Current_Target\",\r\n            \"type\": \"Edm.Self.TaskVersion\",\r\n            \"multiplicity\": \"1\",\r\n            \"onDelete\": {\r\n              \"action\": \"Cascade\"\r\n            }\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskVersionTracker_Current_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskVersionTracker_Current_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"VersionTrackerCurrent\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskVersionTracker_Historical\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskVersionTracker_Historical_Source\",\r\n            \"type\": \"Edm.Self.TaskVersionTracker\",\r\n            \"multiplicity\": \"0..1\"\r\n          },\r\n          {\r\n            \"role\": \"TaskVersionTracker_Historical_Target\",\r\n            \"type\": \"Edm.Self.TaskVersion\",\r\n            \"multiplicity\": \"*\"\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskVersionTracker_Historical_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskVersionTracker_Historical_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"VersionTrackerHistorical\"\r\n            }\r\n          }\r\n        }\r\n      },\r\n      {\r\n        \"name\": \"TaskVersionTracker_Pending\",\r\n        \"end\": [\r\n          {\r\n            \"role\": \"TaskVersionTracker_Pending_Source\",\r\n            \"type\": \"Edm.Self.TaskVersionTracker\",\r\n            \"multiplicity\": \"0..1\"\r\n          },\r\n          {\r\n            \"role\": \"TaskVersionTracker_Pending_Target\",\r\n            \"type\": \"Edm.Self.TaskVersion\",\r\n            \"multiplicity\": \"*\"\r\n          }\r\n        ],\r\n        \"referentialConstraint\": {\r\n          \"principal\": {\r\n            \"role\": \"TaskVersionTracker_Pending_Source\",\r\n            \"propertyRef\": {\r\n              \"name\": \"Guid\"\r\n            }\r\n          },\r\n          \"dependent\": {\r\n            \"role\": \"TaskVersionTracker_Pending_Target\",\r\n            \"propertyRef\": {\r\n              \"name\": \"VersionTrackerPending\"\r\n            }\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"entityContainer\": {\r\n      \"name\": \"TaskContext\",\r\n      \"entitySet\": [\r\n        {\r\n          \"name\": \"TaskVersion1\",\r\n          \"entityType\": \"Self.TaskVersionTracker\"\r\n        },\r\n        {\r\n          \"name\": \"TaskVersions\",\r\n          \"entityType\": \"Self.TaskVersion\"\r\n        },\r\n        {\r\n          \"name\": \"Approvals\",\r\n          \"entityType\": \"Self.Approval\"\r\n        },\r\n        {\r\n          \"name\": \"Tasks\",\r\n          \"entityType\": \"Self.Task\"\r\n        },\r\n        {\r\n          \"name\": \"TaskTags\",\r\n          \"entityType\": \"Self.TaskTag\"\r\n        },\r\n        {\r\n          \"name\": \"Tags\",\r\n          \"entityType\": \"Self.Tag\"\r\n        }\r\n      ],\r\n      \"associationSet\": [\r\n        {\r\n          \"name\": \"TaskVersion_Approval\",\r\n          \"association\": \"Self.TaskVersion_Approval\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskVersion_Approval_Source\",\r\n              \"entitySet\": \"TaskVersions\"\r\n            },\r\n            {\r\n              \"role\": \"TaskVersion_Approval_Target\",\r\n              \"entitySet\": \"Approvals\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"TaskTag_Tag\",\r\n          \"association\": \"Self.TaskTag_Tag\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskTag_Tag_Source\",\r\n              \"entitySet\": \"TaskTags\"\r\n            },\r\n            {\r\n              \"role\": \"TaskTag_Tag_Target\",\r\n              \"entitySet\": \"Tags\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"Task_TaskTags\",\r\n          \"association\": \"Self.Task_TaskTags\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"Task_TaskTags_Source\",\r\n              \"entitySet\": \"Tasks\"\r\n            },\r\n            {\r\n              \"role\": \"Task_TaskTags_Target\",\r\n              \"entitySet\": \"TaskTags\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"TaskVersion_Entity\",\r\n          \"association\": \"Self.TaskVersion_Entity\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskVersion_Entity_Source\",\r\n              \"entitySet\": \"TaskVersions\"\r\n            },\r\n            {\r\n              \"role\": \"TaskVersion_Entity_Target\",\r\n              \"entitySet\": \"Tasks\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"TaskVersionTracker_Current\",\r\n          \"association\": \"Self.TaskVersionTracker_Current\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskVersionTracker_Current_Source\",\r\n              \"entitySet\": \"TaskVersion1\"\r\n            },\r\n            {\r\n              \"role\": \"TaskVersionTracker_Current_Target\",\r\n              \"entitySet\": \"TaskVersions\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"TaskVersionTracker_Historical\",\r\n          \"association\": \"Self.TaskVersionTracker_Historical\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskVersionTracker_Historical_Source\",\r\n              \"entitySet\": \"TaskVersion1\"\r\n            },\r\n            {\r\n              \"role\": \"TaskVersionTracker_Historical_Target\",\r\n              \"entitySet\": \"TaskVersions\"\r\n            }\r\n          ]\r\n        },\r\n        {\r\n          \"name\": \"TaskVersionTracker_Pending\",\r\n          \"association\": \"Self.TaskVersionTracker_Pending\",\r\n          \"end\": [\r\n            {\r\n              \"role\": \"TaskVersionTracker_Pending_Source\",\r\n              \"entitySet\": \"TaskVersion1\"\r\n            },\r\n            {\r\n              \"role\": \"TaskVersionTracker_Pending_Target\",\r\n              \"entitySet\": \"TaskVersions\"\r\n            }\r\n          ]\r\n        }\r\n      ]\r\n    }\r\n  }\r\n}";
    
});
