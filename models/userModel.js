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
          default: "Welcome to our Barbershop, where grooming meets style and tradition!",
        },
        sub_header: {
          type: String,
          default:
            "At our Barbershop, we take pride in providing top-notch grooming services tailored to your unique style and personality. Our skilled barbers combine classic techniques with modern trends to deliver exceptional results that exceed your expectations.",
        },
      },
      tr: {
        header: {
          type: String,
          default: "Kuaförümüze hoş geldiniz, bakım ve tarzın buluştuğu yer!",
        },
        sub_header: {
          type: String,
          default:
            "Kuaförümüzde, benzersiz tarzınıza ve kişiliğinize uygun üstün bakım hizmetleri sunmaktan gurur duyuyoruz. Usta berberlerimiz klasik teknikleri modern trendlerle birleştirerek, beklentilerinizi aşan olağanüstü sonuçlar sunuyor.",
        },
      },
      ar: {
        header: {
          type: String,
          default: "مرحبًا بك في متجر الحلاقة الخاص بنا، حيث تجتمع العناية بالمظهر مع الأناقة والتقاليد!",
        },
        sub_header: {
          type: String,
          default:
            "في متجر الحلاقة الخاص بنا، نفخر بتقديم خدمات عناية بالمظهر عالية الجودة مصممة خصيصًا لأسلوبك وشخصيتك الفريدة. يجمع حلاقونا المهرة بين التقنيات الكلاسيكية والاتجاهات الحديثة لتقديم نتائج استثنائية تتجاوز توقعاتك.",
        },
      },
      de: {
        header: {
          type: String,
          default: "Willkommen in unserem Friseursalon, wo Pflege auf Stil und Tradition trifft!",
        },
        sub_header: {
          type: String,
          default:
            "In unserem Friseursalon legen wir Wert auf hochwertige Pflegeleistungen, die Ihrem einzigartigen Stil und Ihrer Persönlichkeit entsprechen. Unsere erfahrenen Friseure kombinieren klassische Techniken mit modernen Trends, um außergewöhnliche Ergebnisse zu erzielen, die Ihre Erwartungen übertreffen.",
        },
      },
    },
    media: {
      logo: {
        type: String,
        default: "public/images/default/logo.svg",
      },
      heroImage: {
        type: String,
        default: "public/images/default/cover.webp",
      },
      images: {
        type: [String],
      },
      themeColor: {
        type: String,
        default: "#1E2F97",
      }, // the theme color of the website should be used to generate other colors. let this be the darkest
      languages: {
        type: [String],
        default: ["tr", "ar", "en", "de"],
      },
    },
  },

  products: {
    type: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        price: String,
        description: String,
        link: String,
      },
    ],
  },

  accountdata: {
    passwordChangedAt: Date,
    subscriptiondate: {
      type: Date,
      default: new Date(),
    },
    subscriptionlastupdatedate: Date,
    subscriptiontype: String,
  },
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
    `public/images/${this.username}/gallery/img-1.webp`,
    `public/images/${this.username}/gallery/img-2.webp`,
    `public/images/${this.username}/gallery/img-3.webp`,
    `public/images/${this.username}/gallery/img-4.webp`,
    `public/images/${this.username}/gallery/img-5.webp`,
    `public/images/${this.username}/gallery/img-6.webp`,
    `public/images/${this.username}/gallery/img-7.webp`,
  ];
  this.products = [
    {
      id: "1",
      title: "SkinMedica TNS Advanced+ Serum",
      price: "$295.00",
      description: "A powerful anti-aging serum that targets fine lines, deep wrinkles and sagging skin.",
      link: `wa.me/${this.phoneNumber}`,
    },
    {
      id: "2",
      title: "SkinCeuticals Triple Lipid Restore 242",
      price: "$150.00",
      description: "An anti-aging facial treatment with essential lipids for mature skin types.",
      link: `wa.me/${this.phoneNumber}`,
    },
    {
      id: "3",
      title: "Augustinus Bader The Rich Cream 50ml",
      price: "$300.00",
      description: `Formulated with high potency botanicals rich in omega 6 fatty acids and antioxidants this cream helps to revive the complexion and
      help soothe dryness for skin that looks and feels smoother, softer and more supple. Backed by 30 years of visionary science. Powered
      by TFC8®.`,
      link: `wa.me/${this.phoneNumber}`,
    },
    {
      id: "4",
      title: "Neocutis LUMIÈRE FIRM Illuminating & Tightening Eye Cream",
      price: "$114.00",
      description: `An anti-aging eye cream that firms, smooths and restores delicate eye area. Neocutis LUMIÈRE® FIRM Illuminating & Tightening Eye Cream
      targets dull and aging skin surrounding the eyes. A blend of growth factors and proprietary peptides boost collagen production,
      encouraging firmer, smoother and more resilient skin without the appearance of fine lines and wrinkles. Caffeine helps reduce
      under-eye puffiness, while vitamin C delivers antioxidant protection.`,
      link: `wa.me/${this.phoneNumber}`,
    },
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
