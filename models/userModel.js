const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    //maxlength: 18, // hasing algo constraints
    select: false,
  },
  passwordConfirmation: {
    type: String,
    required: true,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords do not match",
    },
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
  },

  businessName: String,
  branches: [
    {
      name: String,
      phoneNumber: String,
      country: String,
      city: String,
      district: String,
      neighborhood: String,
      street: String,
      fulladdress: String,
      googlemapslink: String, /// ???
      coords: {
        lat: String,
        lng: String,
      }, /// ???
      employees: [{ name: String, avaliable: Boolean, phoneNumber: String, weekend: [Number] }],
      shortestAppointmant: Number,

      weekend: [Number],
      weekschedule: {
        type: [
          {
            opening: Number, // Minutes since midnight
            closing: Number,
          },
        ],
        default: [
          { opening: 540, closing: 1080 }, // Monday
          { opening: 540, closing: 1080 }, // Tuesday
          { opening: 540, closing: 1080 }, // Wednesday
          { opening: 540, closing: 1080 }, // Thursday
          { opening: 540, closing: 1080 }, // Friday
          { opening: 540, closing: 780 }, // Saturday
          {}, // Sunday
        ],
      },
      breaks: {
        type: [
          {
            start: Number,
            end: Number,
            for: {
              type: String,
              enum: ["everyday", "0", "1", "2", "3", "4", "5", "6"],
              default: "everyday",
            },
          },
        ],
      },
      holidays: [Date],
      // weekdays: [
      //   {
      //     day: Number, // 0 - 6
      //     openinghour: Number,
      //     closeinghour: Number,
      //     breakstart: Number,
      //     breakend: Number,
      //   },
      // ],
      // weekend: [Number],
    },
  ],

  userMediaAndContent: {
    content: {
      en: {
        header: {
          type: String,
          default: "Welcome to [Barber's Name] Barbershop, where grooming meets style and tradition!",
        },
        sub_header: {
          type: String,
          default:
            "At [Barber's Name] Barbershop, we take pride in providing top-notch grooming services tailored to your unique style and personality. Our skilled barbers combine classic techniques with modern trends to deliver exceptional results that exceed your expectations.",
        },
      },
      tr: {
        header: {
          type: String,
          default: "TR Header",
        },
        sub_header: {
          type: String,
          default:
            "TR Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut nisi culpa atque non dolorem aperiam dolor, sapiente facere perferendis beatae repellat quos ex sunt nihil vitae modi necessitatibus a deleniti.",
        },
      },
      ar: {
        header: {
          type: String,
          default: "AR header",
        },
        sub_header: {
          type: String,
          default:
            "AR Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut nisi culpa atque non dolorem aperiam dolor, sapiente facere perferendis beatae repellat quos ex sunt nihil vitae modi necessitatibus a deleniti.",
        },
      },
    },
    media: {
      logo: {
        type: String,
        default: "public/images/default/logo.svg",
      }, // /public/logos/usernanme
      heroImage: {
        type: String,
        default: "public/images/default/cover.webp",
      }, // /public/images/usernanme-heroimage.webp
      images: {
        type: [String],
      }, // /public/images/usernanme-imagename
      themeColor: {
        type: String,
        default: "#1E2F97",
      }, // the theme color of the website should be used to generate other colors. let this be the darkest
      languages: {
        type: [String],
        default: ["tr", "ar", "en"],
      },
    },
  },

  products: [
    {
      title: String,
      price: String,
      description: String,
      image: String,
      link: String,
    },
  ],
  passwordChangedAt: Date,
});

// colors: {
//     background_color: { type: String, default: "#fff" },
//     nav_bar_color: { type: String, default: "#fff" },
//     // section1_background_color: يجب ان تكون افتح من لون شريط التنقل
//     // لون الازرار بنفس لون شريط التنقل
//     // ممكن: لا داعي للون الخلفية ويكفي اخذ لون واحد من المستخدم لتحديد ثيم الموقع على اساسه
// },

// to hash the password before saving the record.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // to only run this fun if password was modified.

  this.password = await bcrypt.hash(this.password, 10);

  this.passwordConfirmation = undefined;

  next();
});

// userSchema.pre("save", async function (next) {
//   this.languages = avaliablelLanguages
//   next();
// });

userSchema.pre("save", async function (next) {
  this.userMediaAndContent.media.images = [
    `public/images/${this.username}/gallery/img-0.webp`,
    `public/images/${this.username}/gallery/img-1.webp`,
    `public/images/${this.username}/gallery/img-2.webp`,
    `public/images/${this.username}/gallery/img-3.webp`,
    `public/images/${this.username}/gallery/img-4.webp`,
  ];
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangrdAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamp < passwordChangedAt;
  }
  // false means not changed
  return false;
};
const user = mongoose.model("users", userSchema);

module.exports = user;
