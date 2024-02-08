
import OpenAI from "openai";

const openai = new OpenAI();

import axios from 'axios'; // Asegúrate de tener Axios instalado

//variables de entorno

const openai_Api_Key = process.env.OPENAI_TOKEN
const verify_token = env.VERIFY_TOKEN
const whatsapp_token = env.WHATSAPP_TOKEN
const asistente_id = env.ASSISTANT_ID


//PROCESO:
//1 Crear Hilo y recuperarlo
//2 Crear y añadir mensaje a hilo
//3 Iniciar ejecucion del Hilo y recuperar ID de la ejecucion
//4 Recupera el estado de ejecucion (RUN)
//5 Obtener mensaje de respuesta
//6 Enviar resultado de funcion invocada a ejecucion(Run)


//1 Crear Hilo y recuperarlo


const openaiApiKey = env.OPENAI_TOKEN; // Reemplaza esto con tu API Key real

async function main() {
  try {
    const response = await axios.post('https://api.openai.com/v1/threads', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openai_Api_Key}`,
        'OpenAI-Beta': 'assistants=v1' 
      }
    });

    const emptyThread = response.data; // Captura la respuesta completa
    const threadID = emptyThread.id; // Extrae el ID del hilo de la respuesta

    console.log(emptyThread); // Muestra la respuesta completa
    console.log(`Thread ID: ${threadID}`); // Muestra el ID del hilo

  } catch (error) {
    console.error(`Error al crear el hilo: ${error.message}`);
  }
}

main();




// 2 Crear y añadir mensaje a hilo

async function createMessage() {
  try {
    const response = await axios.post(`https://api.openai.com/v1/threads/${threadID}/messages`, {
      role: "user",
      content: mensaje
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openai_Api_Key}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });

    console.log('Mensaje creado:', response.data);
  } catch (error) {
    console.error('Error al crear el mensaje:', error.response ? error.response.data : error.message);
  }
}

createMessage();




//3 Iniciar ejecucion del Hilo y recuperar ID de la ejecucion

async function createRun() {
  try {
    const response = await axios.post(`https://api.openai.com/v1/threads/${threadID}/runs`, {
      assistant_id: asistente_id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openai_Api_Key}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });

    const runID = response.data.id; // Extrae el ID de la ejecución de la respuesta
    console.log('Run ID:', runID);
  } catch (error) {
    console.error('Error al crear la ejecución:', error.response ? error.response.data : error.message);
  }
}

createRun();



//4 Recupera el estado de ejecucion (RUN)

async function getRunDetails() {
  try {
    const response = await axios.get(`https://api.openai.com/v1/threads/${threadID}/runs/${runID}`, {
      headers: {
        'Authorization': `Bearer ${openai_Api_Key}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });

    const runStatus = response.status; // Extrae el estado HTTP de la respuesta
    const data = response.data; // Captura el cuerpo de la respuesta

    // Asumiendo que la estructura de 'data' incluye 'required_action.submit_tool_outputs.tool_calls'
    const function_param_text = data.required_action?.submit_tool_outputs?.tool_calls[0]?.function?.arguments;
    const function_name = data.required_action?.submit_tool_outputs?.tool_calls[0]?.function?.name;
    const tool_call_id = data.required_action?.submit_tool_outputs?.tool_calls[0]?.id;

    console.log('Run Status:', runStatus);
    console.log('Function Param Text:', function_param_text);
    console.log('Function Name:', function_name);
    console.log('Tool Call ID:', tool_call_id);
  } catch (error) {
    console.error('Error al obtener detalles de la ejecución:', error.response ? error.response.data : error.message);
  }
}

getRunDetails();




// 5 Obtener mensaje de respuesta

async function getMessage() {
  try {
    const response = await axios.get(`https://api.openai.com/v1/threads/${threadID}/messages/${messageID}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openai_Api_Key}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });

    // Asumiendo que la respuesta incluye el contenido del mensaje en 'content.text.value'
    const mensaje_respuesta = response.data.content.text.value; // Ajusta esta línea según la estructura real de la respuesta

    console.log('Mensaje:', mensaje_respuesta);
  } catch (error) {
    console.error('Error al obtener el mensaje:', error.response ? error.response.data : error.message);
  }
}

getMessage();


///////////////////FUNCIONES/////////////////////////////////

//RESERVAR MESA

// 1. Filtrar y obtener los parámetros de la función reservar_mesa
const reservar_mesa = workflow.required_action.submit_tool_outputs.tool_calls.find(call => call.function.name === 'reservar_mesa');


if (reservar_mesa) {
  const reservar_mesa_params = JSON.parse(reservar_mesa.function.arguments);
  // 2. Hacer un POST a webhook
  const webhookURL = 'https://hook.eu2.make.com/7dovs57qgwgfc5buyakktndx2s3bto8k';
  // 3 Obtener respuesta de webhook
  const { data: webhook_response } = await axios.post(webhookURL, reservar_mesa_params);
  // Enviar la respuesta al asistente
  workflow.toolOutputs = [
    {
      tool_call_id: reservar_mesa.id,
      output: webhook_response
    }
  ]
  
}


//FECHA DE HOY

// 1. Filtrar y obtener los parámetros de la función fecha_hoy
const fecha_hoy = workflow.required_action.submit_tool_outputs.tool_calls.find(call => call.function.name === 'fecha_hoy');

if (fecha_hoy) {
  workflow.toolOutputs = [
    {
      tool_call_id: fecha_hoy.id,
      output: new Date().toISOString()
    }
  ]
}


//VER DISPONIBILIDAD

// 1. Filtrar y obtener los parámetros de la función ver_disponibilidad
const ver_disponibilidad = workflow.required_action.submit_tool_outputs.tool_calls.find(call => call.function.name === 'ver_disponibilidad');

if (ver_disponibilidad) {
  const ver_disponibilidad_params = JSON.parse(ver_disponibilidad.function.arguments);
  // 2. Hacer un POST a webhook
  const webhookURL = 'https://hook.eu2.make.com/bzm1bcp3cgykq5b004zptvxy00yhluic';
  // 3 Obtener respuesta de webhook
  const { data: webhook_response } = await axios.post(webhookURL, ver_disponibilidad_params);
  // Enviar la respuesta al asistente
  workflow.toolOutputs = [
    {
      tool_call_id: ver_disponibilidad.id,
      output: webhook_response
    }
  ]
  
}


//ELIMINAR RESERVA (MODIFICAR REGISTRO)

// 1. Filtrar y obtener los parámetros de la función eliminar_reserva
const eliminar_reserva = workflow.required_action.submit_tool_outputs.tool_calls.find(call => call.function.name === 'eliminar_reserva');

if (eliminar_reserva) {
  const eliminar_reserva_params = JSON.parse(eliminar_reserva.function.arguments);
  // 2. Hacer un POST a webhook
  const webhookURL = 'https://hook.eu2.make.com/ic3lgm2m85a8pjpwvd06judp06mt98gw';
  // 3 Obtener respuesta de webhook
  const { data: webhook_response } = await axios.post(webhookURL, eliminar_reserva_params);
  // Enviar la respuesta al asistente
  workflow.toolOutputs = [
    {
      tool_call_id: eliminar_reserva.id,
      output: webhook_response
    }
  ]
  
}

//COMPROBAR RESERVA

// 1. Filtrar y obtener los parámetros de la función comprobar_reserva
const comprobar_reserva = workflow.required_action.submit_tool_outputs.tool_calls.find(call => call.function.name === 'comprobar_reserva');

if (comprobar_reserva) {
  const comprobar_reserva_params = JSON.parse(comprobar_reserva.function.arguments);
  // 2. Hacer un POST a webhook
  const webhookURL = 'https://hook.eu2.make.com/3kiyahmwul8qg5f7sps8zzppv5h8dnnp';
  // 3 Obtener respuesta de webhook
  const { data: webhook_response } = await axios.post(webhookURL, comprobar_reserva_params);
  // Enviar la respuesta al asistente
  workflow.toolOutputs = [
    {
      tool_call_id: comprobar_reserva.id,
      output: webhook_response
    }
  ]
  
}



////////////////////////////////////////////////////////////////


//6 Enviar resultado de funcion invocada a ejecucion(Run)


async function submitToolOutputs() {
    try {
      const response = await axios.post(`https://api.openai.com/v1/threads/${threadID}/runs/${runID}/submit_tool_outputs`, {
        tool_outputs: [
          {
            tool_call_id: tool_call_id,
            output: output,
          },
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${openai_Api_Key}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        }
      });
  
      console.log('Tool outputs submitted:', response.data);
    } catch (error) {
      console.error('Error submitting tool outputs:', error.response ? error.response.data : error.message);
    }
  }
  
  submitToolOutputs();






// VER SI ESTA BIEN ESTO (COPIE LO DE BOTPRESS QUITANDO .WORKFLOW ES PARA ESPERAR 
//QUE EL ESTADO DE EJECUCION ESTE COMPLETO Y DEVUELVA EL MENSAJE CON LA RESPUESTA)



const waitTillRunComplete = async () => {
  const statusResponse = await retryingAxiosRequest({
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api.openai.com/v1/threads/${threadId}/runs/${runID}`,
    headers: {
      'OpenAI-Beta': 'assistants=v1',
      Authorization: `Bearer ${openai_Api_Key}`,
      'Content-Type': 'application/json'
    }
  })

  if (['queued', 'in_progress'].includes(statusResponse.data.status) === false) {
    console.log('the status is:', statusResponse.data.status)
    if (statusResponse.data.status === 'requires_action') {
      workflow.required_action = statusResponse.data.required_action
    }
    return
  }
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
  await waitTillRunComplete()
}

await waitTillRunComplete()


