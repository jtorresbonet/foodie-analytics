import { Chart, registerables} from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-adapter-date-fns';
import "bootstrap-icons/font/bootstrap-icons.css";
import linearModel from '../data/model_lr.json'
import decisionTreeModel from '../data/model_dt.json'


var chart_data;

async function initialize() {
  Chart.register(...registerables, ChartDataLabels);
  Chart.defaults.backgroundColor = '#fff';

  const response = await fetch("data/data.json");
  chart_data = await response.json();

  let l1 =document.getElementById("n_recipes")
  l1.addEventListener("click", function () {display_chart("n_recipes")});

  let l2 =document.getElementById("n_ratings")
  l2.addEventListener("click", function () {display_chart("n_ratings") });

  let l3 =document.getElementById("n_categories")
  l3.addEventListener("click", function () {display_chart("n_categories") });

  let l4 =document.getElementById("n_authors")
  l4.addEventListener("click", function () {display_chart("n_authors") });

  let l5 =document.getElementById("n_description_length")
  l5.addEventListener("click", function () {display_chart("n_description_length") });

  let exploring_go_back =document.getElementById("exploring_go_back")
  exploring_go_back.addEventListener("click", function () { turn_on_charts(false)}
    );

  let lh1 =document.getElementById("health_definition")
  lh1.addEventListener("click", function () {display_health_chart("n_healthy_composition") });   

  let lh2 =document.getElementById("health_trend")
  lh2.addEventListener("click", function () {display_health_chart("n_healthy_time") });   

  let health_go_back =document.getElementById("health_go_back")
  health_go_back.addEventListener("click", function () { turn_on_health_charts(false)}
    );


  let submit_results =document.getElementById("submit_results")
  submit_results.addEventListener("click", function () { predictClass()}
      );

  document.getElementById('nav_header').addEventListener('click', function() {
    document.getElementById('header').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('nav_page_1').addEventListener('click', function() {
    document.getElementById('page_1').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('nav_page_2').addEventListener('click', function() {
    document.getElementById('page_2').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('nav_page_3').addEventListener('click', function() {
    document.getElementById('page_3').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('nav_page_4').addEventListener('click', function() {
    document.getElementById('page_4').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('nav_page_5').addEventListener('click', function() {
    document.getElementById('page_5').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

    document.getElementById('nav_page_6').addEventListener('click', function() {
    document.getElementById('page_6').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  document.getElementById('health_comparison').addEventListener('click', function() {
    document.getElementById('page_5').scrollIntoView({
      behavior: 'smooth', // Smooth scrolling
      block: 'start'      // Align the top of the div to the top of the viewport
    });
  });

  

  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.page');
  const wrap = document.getElementById('wrap');

  function checkActiveSection() {
    let currentSection = null;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTop = section.getBoundingClientRect().top;
      const sectionHeight = section.offsetHeight;
  
      if (sectionTop <= window.innerHeight / 2 && sectionTop + sectionHeight >= window.innerHeight / 2) {
        currentSection = section;
        break;
      }
    }

    navItems.forEach(item => {
      item.classList.remove('active');
      var item_id = item.getAttribute('id').slice(4)
      if (currentSection && item_id === currentSection.getAttribute('id')) {
        item.classList.add('active');
      }
    });
  }
  

  predictClass()

  wrap.addEventListener('scroll', checkActiveSection);


}

function get_data(ch) {

  var data = chart_data.filter(a => a.id == ch)[0];

  var type; var options; var explanation; var title;

  if (ch == 'n_recipes') {

      explanation = "By plotting the number of recipes published over time, we undestand the data ranges from <b>August 1998 to September 2020 </b>. "
      explanation += "The number of recipes published has not been constant over time, wich much <b>more publications between 2005 and 2010 </b>, reaching a maximum of 749 publications in January 2009.<br><br>"
      explanation += "After 2014, the number of recipes published has generally been under 10 per month, <b>with September 2020 only having one publication</b>. "
      explanation += "From this, we can determine the <b>most accurate data can be extracted from the 2005 and 2010 range</b>, as the other timelines might not have enough publications to be representative."

      let non_nan_array = (data['datasets'][0]['data']).filter((a) => a == "NaN" ? 0 : parseInt(a));
      let max_value = Math.max(...non_nan_array)
      data['datasets'][0]['borderColor'] = '#3436ca';
      data['datasets'][0]['datalabels'] = {
        align: 'top',
        anchor: 'end'
      }
      type = 'line';
      options = {
        plugins: {
          legend: {
              display: false
          },
          title: {
            display: true,
            text: 'Number of recipes over published time',
            color: "#242449",
            padding: {
              bottom: 40  // Space below the title (between title and chart)
          },
            font: {
              size: 18
          }
        },
          datalabels: {
            display: true,
            borderRadius: 4,
            color: '#ffffff',
            backgroundColor:  function(context)  {
              if (context.dataIndex === context.dataset.data.length - 1 ||  context.dataset.data[context.dataIndex] == max_value)
                {
                    return context.dataset.borderColor;
                }
                return "";
            },
            font: {
              weight: 'bold'
            },
            formatter: function(value, context) {
              if (context.dataIndex === context.dataset.data.length - 1 || value == max_value)
              {
                  return value;
              }
              return "";
          },
            padding: 6
          }
      },
      elements: {
        point: {
          pointStyle: false,
          hitRadius: 2,
        },
        line: {
          tension: 0.4
        }
      },
      layout: {
        padding: {
          right: 20, // Add 20 pixels of extra padding to the right side
          top: 0
        }
      },
      maintainAspectRatio: false,

    }
  }

  if (ch == 'n_ratings') {

    explanation = "The <b>average rating is 4.63 / 5 </b> and is quite constant over time, with a standard deviation of only 0.68 points. We can see a <b>slightly decline on ratings starting 2014</b>, but this can be attributated to <b>less number of recipes available</b> to get a big enough sample. In some cases, we can see the graph line breaking, indicating that the recipes posted did not get a single rating.<br><br>"
    explanation += "Overall, we can conclude that <b>most of the recipes get positive reviews</b>."

    data['datasets'][0]['borderColor'] = '#3436ca';
    data['datasets'][0]['datalabels'] = {
      align: 'top',
      anchor: 'end'
    }
    type = 'line';
    options = {
      plugins: {
        legend: {
            display: false
        },
        title: {
          display: true,
          text: 'Average rating over published time',
          color: "#242449",
          padding: {
            bottom: 40  // Space below the title (between title and chart)
        },
          font: {
            size: 18
        }
        },
        datalabels: {
          display: false,
          borderRadius: 4,
          color:  function(context) {
            return context.dataset.backgroundColor;
          },
          font: {
            weight: 'bold'
          },
          formatter: function(value) {
            return parseFloat(value.toFixed(2));
          },
          padding: 6
        }
    },
    elements: {
      point: {
        pointStyle: false,
        hitRadius: 2,
      },
      line: {
        tension: 0.4,
        spanGaps: false
      }
    },
    scales: {
      y: {
        min: 2.5,
        max: 6
      }
    },
    maintainAspectRatio: false,

  }
}

if (ch == 'n_authors') {

  explanation = "First thing we see  is the number of unique contributors closely matches the number of recipes published. That is, <b>the more authors then the more recipes get published</b>.<br><br>"
  explanation += "Similarly to the first graph in the exploring section, <b>most authors were active between 2005 and 2010</b>, reaching a maximum of <b>415 authors in September 2009</b>."

  let non_nan_array = (data['datasets'][0]['data']).filter((a) => a == "NaN" ? 0 : parseInt(a));
  let max_value = Math.max(...non_nan_array)
  data['datasets'][0]['borderColor'] = '#3436ca';
  data['datasets'][0]['datalabels'] = {
    align: 'top',
    anchor: 'end'
  }
  type = 'line';
  options = {
    plugins: {
      legend: {
          display: false
      },
      title: {
        display: true,
        text: 'Number of unique contributors over time',
        color: "#242449",
        padding: {
          bottom: 40  // Space below the title (between title and chart)
      },
        font: {
          size: 18
      }
      },
      datalabels: {
            display: true,
            borderRadius: 4,
            color: '#ffffff',
            backgroundColor:  function(context)  {
              if (context.dataIndex === context.dataset.data.length - 1 ||  context.dataset.data[context.dataIndex] == max_value)
                {
                    return context.dataset.borderColor;
                }
                return "";
            },
            font: {
              weight: 'bold'
            },
            formatter: function(value, context) {
              if (context.dataIndex === context.dataset.data.length - 1 || value == max_value)
              {
                  return value;
              }
              return "";
          },
            padding: 6
          }
      },
  elements: {
    point: {
      pointStyle: false,
      hitRadius: 2,
    },
    line: {
      tension: 0.4,
      spanGaps: true
    }
  },
  layout: {
    padding: {
      right: 20, // Add 20 pixels of extra padding to the right side
      top: 0
    }
  },
  maintainAspectRatio: false,

}
}

if (ch == 'n_categories') {

  explanation = "There are <b>312 unique categories</b> in the dataset, which is a lot to start. To easy the job, we grouped any category representing < 1% recipes in the <b>'Other' category</b>. Although it is now the 'most popular' category, it makes it easier to focus on the rest.<br><br>"
  explanation += "The most popular category are <b>desserts, followed by Launch/Snacks, Breakfast and Quick Breads</b>. Breads in particular is an interesting category, cause it appears several times: Quick Breads, Breads, Yeast Breads...<br><br>"
  explanation += "From this, we can see we might need to do a <b>better job with categorizing the recipes, based on Keywords instead.</b>"

  type = 'doughnut';
  options = {
    plugins: {
      legend: {
          display: false
      },
      title: {
        display: true,
        text: 'Numer of recipes per category',
        color: "#242449",
        padding: {
          bottom: 40
        },
        font: {
          size: 18
      }
      },
        datalabels: {
          display: 'auto',
          formatter: (value, ctx) => {
            let sum = 0;
            let dataArr = ctx.chart.data.datasets[0].data;
            let label = ctx.chart.data.labels[ctx.dataIndex];
            dataArr.map(data => {
              sum += data;
            });
            let percentage = (value * 100 / sum).toFixed(2) + "%";
            return `${label}: ${percentage}`;
            ;
          },
          color: '#242449',
          font: {
            weight: 'bold',
            size: 14
          },
          padding: 6,
          anchor: 'end',
          align: 'end'
        }

  },
  maintainAspectRatio: false,
  cutout: '50%',
}
}

if (ch == 'n_description_length') {

  explanation = "This is just a funny one for me to check... There is this belief that nowadays most recipes include a super long introduction by the author, before actually jumping to the recipe.<br><br>"
  explanation += "We can check the <b>description length over time</b> to see if that is a new trend. The length hovers on an <b>average of 230 charaters for the 2005 - 2010 range</b>, when most of the recipes were published. We do hit a <b>max of 385 on May 2019</b>, but the recent trends seem more variable than actually moving upwards.<br><br>"
  explanation += "From this data alone, we cannot determine that the inner joke is actually true!"

  let non_nan_array = (data['datasets'][0]['data']).filter((a) => a == "NaN" ? 0 : parseInt(a));
  let max_value = Math.max(...non_nan_array)
  data['datasets'][0]['borderColor'] = '#3436ca';
  data['datasets'][0]['datalabels'] = {
    align: 'top',
    anchor: 'end'
  }
  type = 'line';
  options = {
    plugins: {
      legend: {
          display: false
      },
      title: {
        display: true,
        text: 'Number of unique contributors over time',
        color: "#242449",
        padding: {
          bottom: 40  // Space below the title (between title and chart)
      },
        font: {
          size: 18
      }
      },
      datalabels: {
            display: true,
            borderRadius: 4,
            color: '#ffffff',
            backgroundColor:  function(context)  {
              if (context.dataIndex === context.dataset.data.length - 1 ||  context.dataset.data[context.dataIndex] == max_value)
                {
                    return context.dataset.borderColor;
                }
                return "";
            },
            font: {
              weight: 'bold'
            },
            formatter: function(value, context) {
              if (context.dataIndex === context.dataset.data.length - 1 || value == max_value)
              {
                  return value;
              }
              return "";
          },
            padding: 6
          }
      },
  elements: {
    point: {
      pointStyle: false,
      hitRadius: 2,
    },
    line: {
      tension: 0.4,
      spanGaps: true
    }
  },
  layout: {
    padding: {
      right: 20, // Add 20 pixels of extra padding to the right side
      top: 0
    }
  },
  maintainAspectRatio: false,

}
}

if (ch == 'n_healthy_composition') {

  title = "What is healthy?"
  explanation = "After normalizing the data, we can faithfuly compare recipes with the keyword 'healthy' vs the others. We see healthy recipes having <b>much lower levels of Fat, Saturated Fat and Cholesterol</b>, when compared to Non-Healthy ones.<br><br>"
  explanation += "On the opposite, Healthy ones have <b>larger amounts of Carbohydrates, Fiber and Sugar</b>. Healthy recipes tend to have <b>lower level of calories and proteins </b>.<br><br>"
  explanation += "To deep dive on <b>why Sugar content is higher in healthy recipes</b>, we can check the top categories, including different kinds of Breads (22.5%), Desserts (10.3%), Breakfast (7.3%) and Beverages (5.6%). These categories all have higher than average contents of sugar, which explains the deviation.<br><br>"
  explanation += "Although <b>'healthy' is spectrum rather than binary variable</b>, and many more aspects are involved (quantities, cooking techniques, ingredients), we should be able to leverage this data to classify other recipes!"

  type = 'radar';
  options = {
    plugins: {
      legend: {
          display: true
      },
      title: {
        display: true,
        text: 'Content of healthy and non-healthy recipes',
        color: "#242449",
        padding: {
          bottom: 40  // Space below the title (between title and chart)
      },
        font: {
          size: 18
      }
      },
      datalabels: {
        display: true,
        borderRadius: 4,
        color: '#ffffff',
        backgroundColor:  function(context)  {
                return context.dataset.borderColor
        },
        font: {
          weight: 'bold'
        },
        formatter: function(value, context) {
              return value.toFixed(2);
        },
        padding: 6
      }
    },
  elements: {
    line: {
      tension: 0,
      borderWidth: 3
    },
    point: {
      pointStyle: true,
      hitRadius: 2,
    },
  },
  layout: {
    padding: {
      top: 20
    }
  },
  maintainAspectRatio: true,
  scales: {
    r: {
        max: 1.25,
        min: 0,
        pointLabels: {
          font: {
            weight: 'bold',
            size: 16
          }
        },
        ticks: {
            stepSize: 0.25,
            display:false,
        }
    }
}

}

}

if (ch == 'n_healthy_time') {

  title = "Is health a trend?"
  explanation = "We will be looking at the healthy recipe's publication rate to determine whether it is a recent trend. From the graphs, we see the <b>highest amount was published between 2005 and 2009</b>, reaching a <b>maximum of #773</b>. These times match with time most recipes were published.<br><br>"
  explanation += "The average % of healthy recipes is close to 17.2%</b>. Although this percentage has increased over time, <b>we cannot for sure say it is a trend due to the low number of recipes published in recent years </b>.<br><br>"

  type = 'bar';
  options = {
    plugins: {
      legend: {
          display: true
      },
      title: {
        display: true,
        text: 'Number and % of healthy recipes published over time',
        color: "#242449",
        padding: {
          bottom: 40  // Space below the title (between title and chart)
      },
        font: {
          size: 18
      }
      },
      datalabels: {
        display: false
      }
    },
  elements: {
    line: {
      tension: 0.5,
      borderWidth: 3
    },
    point: {
      pointStyle: false,
      hitRadius: 2,
    },
  },
  layout: {
    padding: {
      top: 0
    }
  },
  maintainAspectRatio: false,
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: false,
        text: '%'
      },
      ticks: {
        callback: function(value, index, ticks) {
          return value + '%';
        }
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: false,
        text: '#'
      },
      grid: {
        drawOnChartArea: false
      }
    }
  }

}

}



  return [data, type, options, explanation, title]
}

function turn_on_charts(mode) {

  let div_id = "exploring_charts";
  let figure_id = "exploring_figure";
  let options_id = "exploring_options"
  let explanation_id = "exploring_explanation"

  if (mode) {
    document.getElementById(figure_id).style.display = "none";
    document.getElementById(options_id).style.display = "none";
  
    document.getElementById(div_id).style.display = "block";
    document.getElementById(explanation_id).style.display = "block";
  } else {
    document.getElementById(div_id).style.display = "none";
    document.getElementById(explanation_id).style.display = "none";

    document.getElementById(figure_id).style.display = "block";
    document.getElementById(options_id).style.display = "block";
  
  }

}

function display_chart(ch) {
  let canvas_id = "exploring_canvas"
  let explanation_text_id = "explanation_text";

  turn_on_charts(true);
  let [data,type, options, explanation] = get_data(ch);

  document.getElementById(explanation_text_id).innerHTML = explanation;

  construct_chart(canvas_id, data, type, options);

}

function turn_on_health_charts(mode) {

  let div_id = "health_container";
  let health_id = "health_view_container"

  if (mode) {
    document.getElementById(div_id).style.display = "none";
    document.getElementById(health_id).style.display = "flex";
  } else {
    document.getElementById(health_id).style.display = "none";
    document.getElementById(div_id).style.display = "block";
  
  }

}

function display_health_chart(ch) {

  let canvas_id = "health_canvas"
  let explanation_text_id = "health_explanation_text";
  let explanation_title = "health_explanation_title"
  turn_on_health_charts(true);

  let [data,type, options, explanation,title] = get_data(ch);

  document.getElementById(explanation_text_id).innerHTML = explanation;
  document.getElementById(explanation_title).innerHTML = title;



  construct_chart(canvas_id, data, type, options);

}

function construct_chart(canvas_id, data, type, options) {

  const ctx = document.getElementById(canvas_id);

  let chartStatus = Chart.getChart(canvas_id); // <canvas> id
  if (chartStatus != undefined) {
    chartStatus.destroy();
  }
  
  new Chart(ctx, {
    type: type,
    data: data,
    options: options
    }
  );

}

initialize()

// Reconstruct the linear regression model
function predictWithLinearRegression(inputData) {
  const { coefficients, intercept, scaler_mean, scaler_scale } = linearModel;

  // Apply the same scaling as in the Python preprocessing
  const scaledInput = inputData //.map((value, index) => (value - scaler_mean[index]) / scaler_scale[index]);

  const prediction = scaledInput.reduce((sum, value, index) => sum + value * coefficients[index], intercept);

  const predictedClass = prediction >= 0 ? 1 : 0;
  return predictedClass;
}

function predictWithDecisionTree(input) {

      // Load the tree from the JSON file and use it in your prediction logic
    const tree = decisionTreeModel;
    const features = ['Calories',
      'FatContent',
      'SaturatedFatContent',
      'CholesterolContent',
      'SodiumContent',
      'CarbohydrateContent',
      'FiberContent',
      'SugarContent',
      'ProteinContent']

      

  function getFeatureIndex(featureName) {
    return features.indexOf(featureName);
  }

  function handleTruncatedBranch(classDistribution) {
    let maxClass = null;
    let maxCount = -1;

    for (const [classLabel, count] of Object.entries(classDistribution)) {
        if (count > maxCount) {
            maxClass = parseInt(classLabel);
            maxCount = count;
        }
    }

    return maxClass;
}

  let currentIndent = 1;

  for (let i = 0; i < tree.length; i++) {
      const node = tree[i];

      if (node.indent != currentIndent) {
          continue;  // Skip backtracking in the tree
      }


      if (node.truncated) {
        return handleTruncatedBranch(node.class_distribution);
    }
      
      if (node.rule.includes("class")) {
          return parseInt(node.rule.split(":")[1].trim());
      }

      const d_parts = node.rule.split("|--- ")[1]; 
      const parts = d_parts.split(" "); 
      const featureName = parts[0].trim();
      const operator = parts[1].trim();
      var th_pos = 2;
      if (operator == ">") {th_pos = 3}
      const threshold = parseFloat(parts[th_pos].trim());
      const featureIndex = getFeatureIndex(featureName);


      if (operator === "<=" && input[featureIndex] <= threshold) {
          currentIndent = node.indent + 1;
      } else if (operator === ">" && input[featureIndex] > threshold) {
          currentIndent = node.indent + 1;
      } 
  }

  return null;  // Default return if no class is reached
}

function draw_prediction(user_data, prediction) {

  let canvas_id = "health_prediction_canvas"
  let explanation_text_id = "prediction_result";
  let prediction_result = prediction == 0 ? 'Not-Healthy' : 'Healthy';

  var ch = "prediction";
  var data = chart_data.filter(a => a.id == ch)[0];
  var type; var options; var title;

  if (ch == 'prediction') {

    title = "Healthy Analysis"
    data['datasets'][0]['backgroundColor'] = "rgba(54, 162, 235, 0.3)";
    data['datasets'][0]['borderColor'] = "rgba(54, 162, 235, 0.6)";
    data['datasets'][0]['borderDash'] = [5,5]
    data['datasets'][1]['backgroundColor'] = "rgba(255, 99, 132, 0.3)"
    data['datasets'][1]['borderColor'] = "rgba(255, 99, 132, 0.5)"
    data['datasets'][1]['borderDash'] = [5,5]
    data['datasets'][2]['backgroundColor'] = "rgba(129, 179, 4, 0.5)"
    data['datasets'][2]['borderColor'] = "rgba(129, 179, 4)"
    data['datasets'][2]['data'] = user_data;
  
    type = 'radar';
    options = {
      plugins: {
        legend: {
            display: true
        },
        title: {
          display: true,
          text: 'Healthy, Non-Healthy and User Input composition',
          color: "#242449",

          font: {
            size: 18
        }
        },
        datalabels: {
          display: function(context) {
            return context.datasetIndex === 2;
          },
          borderRadius: 4,
          color: '#ffffff',
          backgroundColor:  function(context)  {
                  return context.dataset.borderColor
          },
          font: {
            weight: 'bold'
          },
          formatter: function(value, context) {
                return value.toFixed(2);
          },
          padding: 6
        }
      },
    elements: {
      line: {
        tension: 0,
        borderWidth: 3
      },
      point: {
        pointStyle: true,
        hitRadius: 2,
      },
    },
    layout: {
      padding: {
        top: 20
      }
    },
    maintainAspectRatio: true,
    scales: {
      r: {
          max: 2,
          min: 0,
          pointLabels: {
            font: {
              weight: 'bold',
              size: 16
            }
          },
          ticks: {
              stepSize: 0.25,
              display:false,
          }
      }
  }
  
  }
  
  }

  document.getElementById(explanation_text_id).innerHTML = prediction_result;
  document.getElementById(explanation_text_id).className = "";
  document.getElementById(explanation_text_id).className = prediction_result;

  construct_chart(canvas_id, data, type, options);
}


function predictClass() {
  const calories = parseInt(document.getElementById('calories').value);
  const fatContent = parseInt(document.getElementById('fatContent').value);
  const saturatedFatContent = parseInt(document.getElementById('saturatedFatContent').value);
  const cholesterolContent = parseInt(document.getElementById('cholesterolContent').value);
  const sodiumContent = parseInt(document.getElementById('sodiumContent').value);
  const carbohydrateContent = parseInt(document.getElementById('carbohydrateContent').value);
  const fiberContent = parseInt(document.getElementById('fiberContent').value);
  const sugarContent = parseInt(document.getElementById('sugarContent').value);
  const proteinContent = parseInt(document.getElementById('proteinContent').value);

  const data = [calories, fatContent, saturatedFatContent, cholesterolContent, sodiumContent, carbohydrateContent, fiberContent, sugarContent, proteinContent];
  const predictionModel = document.querySelector('input[name="predictionModel"]:checked').value;



  let prediction;
  if (predictionModel === 'linearRegression') {
    prediction = predictWithLinearRegression(data);
  } else {
    prediction = predictWithDecisionTree(data);
  }

  function normalize(d) {
    var ch = "radar_chart_normalization";
    var m = chart_data.filter(a => a.id == ch)[0]['values'];
    const result = d.map((value, index) => value / m[index]);
    return result
  }

  var normalized_data = normalize(data)

  draw_prediction(normalized_data, prediction)

}