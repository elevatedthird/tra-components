// import once from "@drupal/once";
//
// // jquery version
// Drupal.behaviors.ariesTable = {
//   attach(context) {
//     $(document).on("tablesawcreate", function(){t
//       const elements = $(once('rowspandata', '.tablesaw-stack tbody tr td[rowspan]', context));
//       elements.each((index, el) => {
//         //replace duplicated label with original header
//         const tdIndex = $(el).index();
//         const th = $(el).closest('table').find('thead th').eq(tdIndex)[0];
//         const label = $(el).find('.tablesaw-cell-label');
//         $(label).text($(th).text());
//
//         //now copy this td over to the next n cells
//         const rowspan = $(el).attr("rowspan") - 1;
//
//         let nextTr = $(el).parent();
//         for(let rowIdx = 0; rowIdx < rowspan; rowIdx++){
//           nextTr = $(nextTr).next("tr");
//           const nextTd = $(el).clone().removeAttr("rowspan");
//           $(nextTd).addClass("tablesaw-hidden-desktop");
//           if(tdIndex >= $(nextTr).children().length){
//             $(nextTr).append($(nextTd));
//           }
//           else{
//             $(nextTr).children().eq(tdIndex).before(nextTd);
//           }
//         }
//       });
//     });
//   },
// };
