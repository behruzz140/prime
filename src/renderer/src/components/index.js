import Button from "./Button.vue";
import AddCamera from "./AddCamera.vue";
import AddMac from "./AddMac.vue";
import AddMarket from "./AddMarket.vue";
import AddPrint from "./AddPrint.vue";
import Sessions from "./Sessions.vue";
import Drawer from "./Drawer.vue";
import CarPlate from "./CarPlate.vue";
import Plans from "./Plans.vue";
import PaymentSelector from "./PaymentSelector.vue";
import ToastContainer from "./ToastContainer.vue";
import SubTitle from "./SubTitle.vue";
import InputDrawer from "./InputDrawer.vue";
import OutputDrawer from "./OutputDrawer.vue";
import Accordion from "./Accordion.vue";
import Input from "./Input.vue";

import { Icon } from "@iconify/vue";
import SessionInfo from "./SessionInfo.vue";

const components = [
  { name: "Button", component: Button },
  { name: "AddCamera", component: AddCamera },
  { name: "AddMac", component: AddMac },
  { name: "SessionInfo", component: SessionInfo },
  { name: "AddPrint", component: AddPrint },
  { name: "AddMarket", component: AddMarket },
  { name: "Icon", component: Icon },
  { name: "Sessions", component: Sessions },
  { name: "Drawer", component: Drawer },
  { name: "CarPlate", component: CarPlate },
  { name: "Plans", component: Plans },
  { name: "PaymentSelector", component: PaymentSelector },
  { name: "ToastContainer", component: ToastContainer },
  { name: "SubTitle", component: SubTitle },
  { name: "InputDrawer", component: InputDrawer },
  { name: "OutputDrawer", component: OutputDrawer },
  { name: "Accordion", component: Accordion },
  { name: "Input", component: Input },
];

export default {
  install(app) {
    components.forEach(({ name, component }) => {
      app.component(name, component);
    });
  },
};
