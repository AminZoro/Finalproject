const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "on_hold"],
      default: "active",
    },
    // // createdBy: {
    // //   type: mongoose.Schema.Types.ObjectId,
    // //   ref: "User",
    // //   required: true,
    // },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// // Add creator as admin member automatically
// ProjectSchema.pre("save", function () {
//   if (this.isNew) {
//     this.members.push({
//       user: this.createdBy,
//       role: "admin",
//       joinedAt: Date.now(),
//     });
//   }
  
// });

// Index for faster queries
ProjectSchema.index({ createdBy: 1, status: 1 });
ProjectSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Project", ProjectSchema);
