import { motion } from "framer-motion";
import { 
  Heart, 
  Users, 
  Target, 
  Sparkles, 
  GraduationCap, 
  Home as HomeIcon,
  HandHeart,
  BookOpen,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import fasela50Hero from "@/assets/fasela50-hero.png";

const Fasela50 = () => {
  const features = [
    {
      icon: Heart,
      title: "كفالة شاملة",
      description: "نتكفل بالأسرة بشكل كامل من احتياجات معيشية وتعليمية وصحية",
      color: "from-rose-500 to-pink-600"
    },
    {
      icon: GraduationCap,
      title: "تعليم الأطفال",
      description: "دورات تعليمية وتنمية مهارات مع منظمات متخصصة",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Lightbulb,
      title: "تنمية المواهب",
      description: "اكتشاف ودعم هوايات الأطفال من رسم وموسيقى وغيرها",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: HomeIcon,
      title: "دعم السكن",
      description: "المساعدة في الإيجار والأثاث والاحتياجات المنزلية",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const stats = [
    { number: "50", label: "أسرة مستهدفة", icon: Users },
    { number: "60-100", label: "طفل يتيم", icon: Heart },
    { number: "24", label: "شهر كفالة", icon: Target },
    { number: "100%", label: "شفافية", icon: Sparkles }
  ];

  const phases = [
    {
      phase: "المرحلة الأولى",
      title: "الاكتشاف والتقييم",
      items: [
        "ترشيح الحالات عبر أدلاء المناطق",
        "مقابلة الأسر وتقييم الاحتياجات",
        "زيارات ميدانية للتحقق"
      ]
    },
    {
      phase: "المرحلة الثانية", 
      title: "الكفالة الشهرية",
      items: [
        "دعم شهري ١٥٠٠-٢٠٠٠ جنيه",
        "متابعة دورية كل ٢-٣ أشهر",
        "تلبية الاحتياجات الطارئة"
      ]
    },
    {
      phase: "المرحلة الثالثة",
      title: "التنمية والتطوير",
      items: [
        "دورات تعليمية للأطفال",
        "دعم الهوايات والمواهب",
        "توفير أدوات التعلم واللابتوب"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src={fasela50Hero} 
                alt="مشروع فسيلة ٥٠ - كفالة ٥٠ عائلة مصرية في رحلتهم التعليمية" 
                className="w-full h-auto"
              />
            </motion.div>

            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <HandHeart className="w-5 h-5" />
              <span className="font-medium">مشروع إنساني متكامل</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              مشروع <span className="text-primary">فسيلة ٥٠</span>
            </h1>
            
            <div className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed text-right space-y-4">
              <p>
                إن شاء الله، هدفُنا كفالةُ <strong className="text-foreground">50 أسرة</strong> و<strong className="text-foreground">60 إلى 100 طفلٍ يتيم</strong>؛ بهدف تكثيف الجهود معهم، ومساندتهم في رحلتهم التعليمية. عسى الله أن يكتب لهذا الأمر النجاحَ والقبول، وأن نُعينهم على إكمال تعليمهم، ليكونوا أسوياءَ نافعِين، ويكسروا دائرةَ الفقر التي عاشها آباؤهم وأجدادهم.
              </p>
              <p>
                ونستعين في هذا المشروع والحمد لله أولًا بالله، ثم بالعلم، وبالتجارب المشابهة في دولٍ مثل الهند وإفريقيا. ويمكنكم الاطّلاع على رحلة الكفالة وآلية الاختيار.
              </p>
              <p>
                هدفُنا أن نُسلّم كلَّ أسرةٍ <strong className="text-foreground">حاسوبًا محمولًا</strong>، وأن يتعلّموا عبر الإنترنت مع الأكاديميات المتعاقدين معها، التي تم اختيارها بعناية. كما نُعلّم الأمهاتَ مبادئَ <strong className="text-foreground">التربية الإيجابية</strong>؛ ليُساعِدننا في رحلة تنشئة الأطفال.
              </p>
              <p>
                نستعين بالله وحده في إتمام هذا الأمر؛ فمهما بذلنا، إن لم يكتب الله لهذا الأمر النجاحَ والقبول، فلا فائدةَ منه.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <motion.a
                href="/cases"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow"
              >
                شارك في الكفالة
              </motion.a>
              <motion.a
                href="/case-pipeline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-background text-foreground border-2 border-primary/20 px-8 py-4 rounded-full font-bold text-lg hover:border-primary/40 transition-colors"
              >
                رحلة الكفالة
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ماذا نقدم؟
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              كفالة شاملة ومتكاملة تغطي جميع احتياجات الأسرة
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Phases Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              مراحل الكفالة
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              رحلة متكاملة من الاكتشاف إلى التمكين
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -20 : index === 2 ? 20 : 0, y: index === 1 ? 20 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full border-2 border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm text-primary font-medium">{phase.phase}</div>
                        <div className="text-lg font-bold text-foreground">{phase.title}</div>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              رؤيتنا
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              نؤمن بأن كل طفل يستحق فرصة للتعلم والنمو والازدهار. هدفنا ليس فقط تلبية الاحتياجات الأساسية، 
              بل بناء جيل قادر على التغيير والإبداع. نسعى لتمكين ٥٠ أسرة لتصبح مستقلة ومنتجة في المجتمع.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="bg-primary/10 px-4 py-2 rounded-full">تمكين الأسر</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">تعليم الأطفال</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">بناء المستقبل</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">شفافية كاملة</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              كن جزءاً من التغيير
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              انضم إلينا في رحلة كفالة ٥٠ أسرة وساهم في بناء مستقبل أفضل لأطفالنا
            </p>
            <motion.a
              href="/cases"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <Heart className="w-5 h-5" />
              ابدأ الكفالة الآن
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Fasela50;